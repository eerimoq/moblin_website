use std::collections::HashMap;
use std::sync::Mutex;
use std::time::{Duration, Instant};

use ring::rand::{SecureRandom, SystemRandom};

const LIFETIME: Duration = Duration::from_secs(120);
const MAX_OUTSTANDING: usize = 10_000;

pub type Challenge = [u8; 32];

pub struct Challenges {
    random: SystemRandom,
    outstanding: Mutex<HashMap<Challenge, Instant>>,
}

impl Challenges {
    pub fn new() -> Self {
        Self {
            random: SystemRandom::new(),
            outstanding: Mutex::new(HashMap::new()),
        }
    }

    pub fn issue(&self) -> Option<Challenge> {
        let mut challenge = Challenge::default();
        self.random.fill(&mut challenge).ok()?;
        let mut outstanding = self.outstanding.lock().unwrap();
        if outstanding.len() >= MAX_OUTSTANDING {
            let now = Instant::now();
            outstanding.retain(|_, issued| now - *issued < LIFETIME);
            if outstanding.len() >= MAX_OUTSTANDING {
                return None;
            }
        }
        outstanding.insert(challenge, Instant::now());
        Some(challenge)
    }

    pub fn consume(&self, challenge: &[u8]) -> bool {
        let Ok(challenge) = Challenge::try_from(challenge) else {
            return false;
        };
        let issued = self.outstanding.lock().unwrap().remove(&challenge);
        issued.is_some_and(|issued| issued.elapsed() < LIFETIME)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn challenges_are_single_use() {
        let challenges = Challenges::new();
        let challenge = challenges.issue().unwrap();
        assert_ne!(challenge, challenges.issue().unwrap());
        assert!(challenges.consume(&challenge));
        assert!(!challenges.consume(&challenge));
        assert!(!challenges.consume(&Challenge::default()));
        assert!(!challenges.consume(&challenge[..31]));
    }

    #[test]
    fn expired_challenges_make_room() {
        let challenges = Challenges::new();
        let long_ago = Instant::now() - LIFETIME * 2;
        challenges
            .outstanding
            .lock()
            .unwrap()
            .extend((0..MAX_OUTSTANDING).map(|i| {
                let mut challenge = Challenge::default();
                challenge[..8].copy_from_slice(&(i as u64).to_be_bytes());
                (challenge, long_ago)
            }));
        assert!(challenges.issue().is_some());
        assert_eq!(challenges.outstanding.lock().unwrap().len(), 1);
    }

    #[test]
    fn refuses_to_issue_when_full() {
        let challenges = Challenges::new();
        for _ in 0..MAX_OUTSTANDING {
            assert!(challenges.issue().is_some());
        }
        assert!(challenges.issue().is_none());
    }
}
