---
track: ethereum-dev
lesson: 01
title: What this track is, and what you'll be able to do
estimated_minutes: 15
---

# What this track is

Ethereum is, depending on which sentence you read about it, either a "world computer," a "settlement layer," a "decentralized application platform," or "internet money." None of these descriptions is wrong. None of them is sufficient. The fastest way to understand what Ethereum actually is is to learn to use it as a developer — to write a small program, deploy it to a public computer that nobody owns, and watch other people interact with it.

That is what this track is for.

Ethereum is the priority technical platform for K-OS. The reasons are practical: the richest contribution surface in this project is in on-chain tooling and the crypto-native creative scene; Ethereum and EVM-compatible chains are where the builder energy concentrates; and the developer skillset translates across an enormous and growing number of L2s, sidechains, and adjacent ecosystems. If you build well on Ethereum, you can build well in most of the spaces that matter for the next decade of this technology.

This track does not assume you have used a wallet, written a smart contract, or thought much about cryptography. It does assume you can program — any modern language is fine; we'll pick up Solidity together — and that you're willing to read primary sources. The Ethereum ecosystem rewards reading the actual specs, the actual contracts, and the actual research, not just the tutorials about them.

## What you'll be able to do by the end

By the time you finish this track, you should be comfortable doing all of the following without looking it up:

- Explain the difference between an externally owned account (EOA) and a contract account, and what each can and cannot do.
- Read a transaction on a block explorer and tell, from the trace, what the contract did and why it cost what it cost.
- Write a non-trivial Solidity contract from scratch — handling state, events, access control, and external calls — without copying it from a template.
- Test that contract with unit tests, fuzz tests, and at least one invariant test, using Foundry locally on your machine.
- Deploy the contract to a testnet and verify it on a block explorer so other people can read its source.
- Read an unfamiliar mainnet contract — pick something live with hundreds of millions of dollars in it — and explain to another developer what it does, where its risks are, and how it would behave under unexpected inputs.
- Recognize the common categories of smart-contract vulnerability (reentrancy, access control flaws, integer issues, oracle manipulation, donation attacks) when you see them, in code that wasn't labeled.
- Hold an opinion about account abstraction and smart-contract wallets, and explain it.
- Place L2s in your mental model — what a rollup is, what it isn't, where data availability fits, why bridges are the riskiest part.

This is not a track for becoming a senior smart-contract auditor. That takes years of additional reading and adversarial practice. It *is* a track for becoming a developer who can build and reason carefully on Ethereum, which is the foundation that further specialization builds on.

## How this track is structured

Twelve lessons. The first four build the conceptual model. The next three put you in front of a real toolchain (Foundry first, with notes on Hardhat for context). The next three turn outward — reading other people's code, understanding what goes wrong when it goes wrong, and engaging with the part of Ethereum where smart-contract wallets are starting to replace EOAs. The last two place all of this in the broader landscape of L2s and tell you where to keep reading after the track ends.

Code examples are runnable as written. When a lesson points you at a real mainnet contract or a real audit report, the link is to a primary source — the contract on Etherscan, the audit PDF, the research post — not a summary of one.

## How this track is *not* structured

This is not a tutorial track that gets you to "deploy your first ERC-20" in twenty minutes and calls it complete. The reason most people who write their first ERC-20 in twenty minutes never write a second contract is that they did not build the underlying model that lets them know why theirs is a normal ERC-20 and what would make it not one. We will go slower, on purpose, so that what you build later you actually understand.

This is also not a get-rich-on-tokens track. The track says nothing about token prices. It says nothing about which projects are good investments. It treats Ethereum the way you would treat Linux: as a technical platform you are learning to build on, not a financial product you are learning to hold.

## Where to start

The next lesson — *Accounts, contracts, and how Ethereum thinks about state* — is the right place to begin. If you are coming into this track already comfortable with that material, skip to lesson 04 and start from Solidity basics; the lessons are designed to be skippable for someone who already knows what's in them.

A working K-OS install is not required to follow this track, but the in-OS course runner (when it ships) will track your progress and run code examples for you in a sandboxed environment. Until then, follow the lessons in your editor of choice and run the code in your own terminal.

Welcome in.
