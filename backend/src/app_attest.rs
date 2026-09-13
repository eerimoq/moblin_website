use anyhow::{Context, Result, ensure};
use ciborium::Value;
use clap::ValueEnum;
use ring::digest::SHA256;
use ring::signature::{ECDSA_P256_SHA256_ASN1, UnparsedPublicKey};
use x509_parser::certificate::X509Certificate;
use x509_parser::oid_registry::asn1_rs::oid;
use x509_parser::pem::parse_x509_pem;
use x509_parser::prelude::FromDer;

const ROOT_CA_PEM: &[u8] = include_bytes!("apple_app_attestation_root_ca.pem");
const NONCE_EXTENSION_PREFIX: &[u8] = &[0x30, 0x24, 0xA1, 0x22, 0x04, 0x20];

#[derive(Clone, Copy, Debug, PartialEq, Eq, ValueEnum)]
pub enum Environment {
    Production,
    Development,
}

impl Environment {
    fn aaguid(self) -> &'static [u8; 16] {
        match self {
            Environment::Production => b"appattest\0\0\0\0\0\0\0",
            Environment::Development => b"appattestdevelop",
        }
    }
}

pub type PublicKey = Vec<u8>;

pub struct AppAttest {
    app_id_hash: [u8; 32],
    environment: Environment,
}

impl AppAttest {
    pub fn new(app_id: &str, environment: Environment) -> Self {
        Self {
            app_id_hash: sha256(&[app_id.as_bytes()]),
            environment,
        }
    }

    pub fn verify_attestation(
        &self,
        attestation: &[u8],
        key_id: &[u8],
        challenge: &[u8],
    ) -> Result<PublicKey> {
        let attestation: Value =
            ciborium::from_reader(attestation).context("attestation is not CBOR")?;
        let format = field(&attestation, "fmt")?
            .as_text()
            .context("fmt is not a string")?;
        ensure!(format == "apple-appattest", "unexpected format {format:?}");
        let statement = field(&attestation, "attStmt")?;
        let certificates = field(statement, "x5c")?
            .as_array()
            .context("x5c is not an array")?
            .iter()
            .map(|value| {
                value
                    .as_bytes()
                    .map(Vec::as_slice)
                    .context("x5c entry is not bytes")
            })
            .collect::<Result<Vec<_>>>()?;
        let auth_data = field(&attestation, "authData")?
            .as_bytes()
            .context("authData is not bytes")?;
        let leaf = self.verify_certificate_chain(&certificates)?;
        let nonce = sha256(&[auth_data, &sha256(&[challenge])]);
        ensure!(
            certificate_nonce(&leaf)? == nonce,
            "the certificate nonce does not match the authenticator data"
        );
        let public_key = leaf.public_key().subject_public_key.data.to_vec();
        ensure!(
            public_key.len() == 65 && public_key[0] == 4,
            "the certificate public key is not an uncompressed P-256 point"
        );
        ensure!(
            sha256(&[&public_key]) == key_id,
            "the key id is not the hash of the certificate public key"
        );
        let auth_data = AuthData::parse(auth_data)?;
        ensure!(
            auth_data.rp_id_hash == self.app_id_hash,
            "the attestation is for another app"
        );
        ensure!(
            auth_data.counter == 0,
            "the attestation counter is not zero"
        );
        let aaguid = auth_data.aaguid.context("no aaguid")?;
        ensure!(
            aaguid == self.environment.aaguid(),
            "the attestation is for another environment: {}",
            String::from_utf8_lossy(aaguid).trim_end_matches('\0')
        );
        ensure!(
            auth_data.credential_id.context("no credential id")? == key_id,
            "the credential id is not the key id"
        );
        Ok(public_key)
    }

    pub fn verify_assertion(
        &self,
        assertion: &[u8],
        client_data: &[u8],
        public_key: &[u8],
    ) -> Result<u32> {
        let assertion: Value = ciborium::from_reader(assertion).context("assertion is not CBOR")?;
        let signature = field(&assertion, "signature")?
            .as_bytes()
            .context("signature is not bytes")?;
        let auth_data = field(&assertion, "authenticatorData")?
            .as_bytes()
            .context("authenticatorData is not bytes")?;
        let nonce = sha256(&[auth_data, &sha256(&[client_data])]);
        UnparsedPublicKey::new(&ECDSA_P256_SHA256_ASN1, public_key)
            .verify(&nonce, signature)
            .ok()
            .context("bad signature")?;
        let auth_data = AuthData::parse(auth_data)?;
        ensure!(
            auth_data.rp_id_hash == self.app_id_hash,
            "the assertion is for another app"
        );
        Ok(auth_data.counter)
    }

    fn verify_certificate_chain<'a>(
        &self,
        certificates: &[&'a [u8]],
    ) -> Result<X509Certificate<'a>> {
        let certificates = certificates
            .iter()
            .map(|der| {
                X509Certificate::from_der(der)
                    .map(|(_, certificate)| certificate)
                    .context("x5c entry is not a certificate")
            })
            .collect::<Result<Vec<_>>>()?;
        let (_, root) = parse_x509_pem(ROOT_CA_PEM).expect("the root certificate is valid PEM");
        let root = root.parse_x509().expect("the root certificate is valid");
        let mut certificates = certificates.into_iter();
        let leaf = certificates.next().context("x5c is empty")?;
        let mut subject = leaf.clone();
        for issuer in certificates {
            ensure!(issuer.is_ca(), "an intermediate certificate is not a CA");
            subject
                .verify_signature(Some(issuer.public_key()))
                .ok()
                .context("a certificate is not signed by the next one in x5c")?;
            subject = issuer;
        }
        subject
            .verify_signature(Some(root.public_key()))
            .ok()
            .context("the certificate chain does not end at Apple's App Attest root")?;
        Ok(leaf)
    }
}

fn certificate_nonce(certificate: &X509Certificate) -> Result<[u8; 32]> {
    let extension = certificate
        .get_extension_unique(&oid!(1.2.840.113635.100.8.2))
        .ok()
        .flatten()
        .context("no nonce extension in the certificate")?;
    extension
        .value
        .strip_prefix(NONCE_EXTENSION_PREFIX)
        .and_then(|nonce| nonce.try_into().ok())
        .context("malformed nonce extension")
}

struct AuthData<'a> {
    rp_id_hash: &'a [u8],
    counter: u32,
    aaguid: Option<&'a [u8]>,
    credential_id: Option<&'a [u8]>,
}

impl<'a> AuthData<'a> {
    fn parse(data: &'a [u8]) -> Result<Self> {
        ensure!(data.len() >= 37, "authenticator data is too short");
        let counter = u32::from_be_bytes(data[33..37].try_into().unwrap());
        let mut auth_data = AuthData {
            rp_id_hash: &data[..32],
            counter,
            aaguid: None,
            credential_id: None,
        };
        let credential = &data[37..];
        if !credential.is_empty() {
            ensure!(
                credential.len() >= 18,
                "attested credential data is too short"
            );
            let length = u16::from_be_bytes(credential[16..18].try_into().unwrap()) as usize;
            ensure!(
                credential.len() >= 18 + length,
                "credential id is truncated"
            );
            auth_data.aaguid = Some(&credential[..16]);
            auth_data.credential_id = Some(&credential[18..18 + length]);
        }
        Ok(auth_data)
    }
}

fn field<'a>(value: &'a Value, name: &str) -> Result<&'a Value> {
    value
        .as_map()
        .context("not a CBOR map")?
        .iter()
        .find(|(key, _)| key.as_text() == Some(name))
        .map(|(_, value)| value)
        .with_context(|| format!("no {name} field"))
}

fn sha256(parts: &[&[u8]]) -> [u8; 32] {
    let mut context = ring::digest::Context::new(&SHA256);
    for part in parts {
        context.update(part);
    }
    context.finish().as_ref().try_into().unwrap()
}

#[cfg(test)]
mod tests {
    use super::*;
    use base64::Engine;
    use base64::prelude::BASE64_STANDARD;

    const APP_ID: &str = "35MFYY2JY5.co.chiff.attestation-test";
    const KEY_ID: &str = "AcP/pnpoNVPIJYZOvmIvWzDvmxkFoQCE4Uu7Nk6WiAA=";
    const ATTESTATION_CHALLENGE: &[u8] = b"attestation-test";
    const ASSERTION_CLIENT_DATA: &[u8] = br#"{"challenge":"assertion-test"}"#;
    const PUBLIC_KEY: &str = "0437c404fa2bbf8fbcf4ee7080573d5fa80c4f6cc3a22f7db43af92c394e7cd1c880c95ab422972625e8e673af1bda2b096654e9b602895601f925bb5941c53082";

    fn base64(text: &str) -> Vec<u8> {
        BASE64_STANDARD.decode(text.trim()).unwrap()
    }

    fn hex(text: &str) -> Vec<u8> {
        (0..text.len())
            .step_by(2)
            .map(|i| u8::from_str_radix(&text[i..i + 2], 16).unwrap())
            .collect()
    }

    fn attestation() -> Vec<u8> {
        base64(include_str!("testdata/attestation.base64"))
    }

    fn assertion() -> Vec<u8> {
        base64(include_str!("testdata/assertion.base64"))
    }

    fn app_attest() -> AppAttest {
        AppAttest::new(APP_ID, Environment::Development)
    }

    fn error(result: Result<impl std::fmt::Debug>) -> String {
        format!("{:#}", result.unwrap_err())
    }

    #[test]
    fn verifies_attestation() {
        let public_key = app_attest()
            .verify_attestation(&attestation(), &base64(KEY_ID), ATTESTATION_CHALLENGE)
            .unwrap();
        assert_eq!(public_key, hex(PUBLIC_KEY));
    }

    #[test]
    fn rejects_attestation_for_another_app() {
        let app_attest = AppAttest::new("35MFYY2JY5.co.chiff.other", Environment::Development);
        let result =
            app_attest.verify_attestation(&attestation(), &base64(KEY_ID), ATTESTATION_CHALLENGE);
        assert_eq!(error(result), "the attestation is for another app");
    }

    #[test]
    fn rejects_attestation_for_another_environment() {
        let app_attest = AppAttest::new(APP_ID, Environment::Production);
        let result =
            app_attest.verify_attestation(&attestation(), &base64(KEY_ID), ATTESTATION_CHALLENGE);
        assert_eq!(
            error(result),
            "the attestation is for another environment: appattestdevelop"
        );
    }

    #[test]
    fn rejects_attestation_with_another_challenge() {
        let result = app_attest().verify_attestation(&attestation(), &base64(KEY_ID), b"other");
        assert_eq!(
            error(result),
            "the certificate nonce does not match the authenticator data"
        );
    }

    #[test]
    fn rejects_attestation_with_another_key_id() {
        let mut key_id = base64(KEY_ID);
        key_id[0] ^= 1;
        let result =
            app_attest().verify_attestation(&attestation(), &key_id, ATTESTATION_CHALLENGE);
        assert_eq!(
            error(result),
            "the key id is not the hash of the certificate public key"
        );
    }

    #[test]
    fn rejects_tampered_attestation() {
        let mut attestation = attestation();
        let position = attestation.len() - 40;
        attestation[position] ^= 1;
        let result =
            app_attest().verify_attestation(&attestation, &base64(KEY_ID), ATTESTATION_CHALLENGE);
        assert_eq!(
            error(result),
            "the certificate nonce does not match the authenticator data"
        );
    }

    fn flip_bit_in(attestation: &mut [u8], occurrence: usize, text: &[u8]) {
        let position = attestation
            .windows(text.len())
            .enumerate()
            .filter(|(_, window)| *window == text)
            .nth(occurrence)
            .unwrap()
            .0;
        attestation[position] ^= 1;
    }

    #[test]
    fn rejects_attestation_with_tampered_certificate() {
        let mut attestation = attestation();
        flip_bit_in(&mut attestation, 0, b"Apple App Attestation CA 1");
        let result =
            app_attest().verify_attestation(&attestation, &base64(KEY_ID), ATTESTATION_CHALLENGE);
        assert_eq!(
            error(result),
            "a certificate is not signed by the next one in x5c"
        );
    }

    #[test]
    fn rejects_attestation_with_tampered_intermediate_certificate() {
        let mut attestation = attestation();
        flip_bit_in(&mut attestation, 1, b"Apple App Attestation CA 1");
        let result =
            app_attest().verify_attestation(&attestation, &base64(KEY_ID), ATTESTATION_CHALLENGE);
        assert_eq!(
            error(result),
            "the certificate chain does not end at Apple's App Attest root"
        );
    }

    #[test]
    fn rejects_garbage_attestation() {
        let result =
            app_attest().verify_attestation(b"garbage", &base64(KEY_ID), ATTESTATION_CHALLENGE);
        assert!(error(result).starts_with("attestation is not CBOR"));
    }

    #[test]
    fn verifies_assertion() {
        let counter = app_attest()
            .verify_assertion(&assertion(), ASSERTION_CLIENT_DATA, &hex(PUBLIC_KEY))
            .unwrap();
        assert_eq!(counter, 3);
    }

    #[test]
    fn rejects_assertion_with_other_client_data() {
        let result = app_attest().verify_assertion(
            &assertion(),
            br#"{"challenge":"assertion-other"}"#,
            &hex(PUBLIC_KEY),
        );
        assert_eq!(error(result), "bad signature");
    }

    #[test]
    fn rejects_assertion_with_another_key() {
        let mut public_key = hex(PUBLIC_KEY);
        public_key[10] ^= 1;
        let result =
            app_attest().verify_assertion(&assertion(), ASSERTION_CLIENT_DATA, &public_key);
        assert_eq!(error(result), "bad signature");
    }

    #[test]
    fn rejects_assertion_for_another_app() {
        let app_attest = AppAttest::new("35MFYY2JY5.co.chiff.other", Environment::Development);
        let result =
            app_attest.verify_assertion(&assertion(), ASSERTION_CLIENT_DATA, &hex(PUBLIC_KEY));
        assert_eq!(error(result), "the assertion is for another app");
    }

    #[test]
    fn rejects_garbage_assertion() {
        let result =
            app_attest().verify_assertion(b"garbage", ASSERTION_CLIENT_DATA, &hex(PUBLIC_KEY));
        assert!(error(result).starts_with("assertion is not CBOR"));
    }
}
