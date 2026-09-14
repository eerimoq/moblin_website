use anyhow::{Context, Result, bail};
use base64::Engine;
use base64::prelude::BASE64_STANDARD;
use bytes::Bytes;
use serde::{Serialize, Serializer};
use uuid::Uuid;

const MAX_SIZE: usize = 1024 * 1024;

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Image {
    pub id: String,
    pub data: Bytes,
}

impl Image {
    pub fn decode(encoded: &str) -> Result<Image> {
        let data = BASE64_STANDARD
            .decode(encoded)
            .context("the image is not base64")?;
        if data.len() > MAX_SIZE {
            bail!("the image is larger than {MAX_SIZE} bytes");
        }
        if !data.starts_with(b"\xff\xd8\xff") {
            bail!("the image is not a JPEG");
        }
        Ok(Image {
            id: Uuid::new_v4().to_string(),
            data: Bytes::from(data),
        })
    }
}

impl Serialize for Image {
    fn serialize<S: Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        serializer.serialize_str(&self.id)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn jpeg(size: usize) -> String {
        let mut data = b"\xff\xd8\xff\xe0".to_vec();
        data.resize(size, 0);
        BASE64_STANDARD.encode(data)
    }

    #[test]
    fn every_image_gets_an_id_of_its_own() {
        let image = Image::decode(&jpeg(100)).unwrap();
        assert_eq!(image.data.len(), 100);
        assert_ne!(image.id, Image::decode(&jpeg(100)).unwrap().id);
        assert!(Uuid::parse_str(&image.id).is_ok());
        assert_eq!(serde_json::to_value(&image).unwrap(), image.id);
    }

    #[test]
    fn rejects_what_is_not_a_small_jpeg() {
        assert!(Image::decode("not base64!").is_err());
        assert!(Image::decode(&BASE64_STANDARD.encode(b"\x89PNG\r\n\x1a\n")).is_err());
        assert!(Image::decode(&BASE64_STANDARD.encode(b"<svg/>")).is_err());
        assert!(Image::decode(&jpeg(MAX_SIZE + 1)).is_err());
        assert!(Image::decode(&jpeg(MAX_SIZE)).is_ok());
    }
}
