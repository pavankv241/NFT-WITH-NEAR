// Find all our documentation at https://docs.near.org
use near_sdk::{log, near};
use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::collections::UnorderedMap;
use near_sdk::json_types::{U128, U64};
use near_sdk::serde::{Deserialize, Serialize};
use near_sdk::{env, near_bindgen, AccountId, PanicOnDefault, Promise};
use schemars::JsonSchema;

// Define the contract structure
#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, JsonSchema)]
#[serde(crate = "near_sdk::serde")]
pub struct TokenMetadata {
    title: String,
    description: String,
    media: String, // This will store the tokenURI
    media_hash: Option<String>,
    copies: Option<u64>,
    issued_at: Option<u64>,
    expires_at: Option<u64>,
    starts_at: Option<u64>,
    updated_at: Option<u64>,
    extra: Option<String>,
    reference: Option<String>,
    reference_hash: Option<String>,
}

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, PanicOnDefault)]
pub struct Contract {
    owner_id: AccountId,
    token_counter: u64,
    tokens_per_owner: UnorderedMap<AccountId, Vec<u64>>,
    token_metadata_by_id: UnorderedMap<u64, TokenMetadata>,
    is_token_uri_minted: UnorderedMap<String, bool>,
}

// Implement the contract structure
#[near_bindgen]
impl Contract {
    #[init]
    pub fn new(owner_id: AccountId) -> Self {
        Self {
            owner_id,
            token_counter: 0,
            tokens_per_owner: UnorderedMap::new(b"t"),
            token_metadata_by_id: UnorderedMap::new(b"m"),
            is_token_uri_minted: UnorderedMap::new(b"u"),
        }
    }

    pub fn mint_nft(&mut self, to: AccountId, token_uri: String) -> u64 {
        // Check if the token URI is already minted
        assert!(
            !self.is_token_uri_minted.get(&token_uri).unwrap_or(false),
            "This NFT is already minted"
        );

        let token_id = self.token_counter;

        // Create token metadata
        let metadata = TokenMetadata {
            title: String::from("Picture NFT"),
            description: String::from("A unique picture NFT"),
            media: token_uri.clone(),
            media_hash: None,
            copies: Some(1),
            issued_at: Some(env::block_timestamp()),
            expires_at: None,
            starts_at: None,
            updated_at: None,
            extra: None,
            reference: None,
            reference_hash: None,
        };

        // Store the token metadata
        self.token_metadata_by_id.insert(&token_id, &metadata);

        // Mark the token URI as minted
        self.is_token_uri_minted.insert(&token_uri, &true);

        // Add token to owner's collection
        let mut owner_tokens = self.tokens_per_owner.get(&to).unwrap_or_default();
        owner_tokens.push(token_id);
        self.tokens_per_owner.insert(&to, &owner_tokens);

        // Increment token counter
        self.token_counter += 1;

        token_id
    }

    pub fn get_token_metadata(&self, token_id: u64) -> Option<TokenMetadata> {
        self.token_metadata_by_id.get(&token_id)
    }

    pub fn get_tokens_for_owner(&self, account_id: AccountId) -> Vec<u64> {
        self.tokens_per_owner.get(&account_id).unwrap_or_default()
    }

    pub fn get_token_counter(&self) -> u64 {
        self.token_counter
    }
}

/*
 * The rest of this file holds the inline tests for the code above
 * Learn more about Rust tests: https://doc.rust-lang.org/book/ch11-01-writing-tests.html
 */
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn get_default_greeting() {
        let contract = Contract::default();
        // this test did not call set_greeting so should return the default "Hello" greeting
        assert_eq!(contract.get_greeting(), "Hello");
    }

    #[test]
    fn set_then_get_greeting() {
        let mut contract = Contract::default();
        contract.set_greeting("howdy".to_string());
        assert_eq!(contract.get_greeting(), "howdy");
    }
}
