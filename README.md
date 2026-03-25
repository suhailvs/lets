# Local Exchange Trading System(LETS)

folders:
+ [frontend](frontend/README.md) -> React App
+ [backend](backend/README.md) -> Python, Django
+ [mobile](mobile/README.md) -> ReactNative Expo App


## Whitepaper / Project Overview


### 1. Introduction

LocalExchange is a platform designed to enable small communities to create and manage their own local exchange trading systems (LETS). The system allows trusted community members to exchange goods and services using locally issued credit without relying on traditional banking infrastructure.

The design focuses on:

* Local trust networks
* Identity verification through community governance
* Sybil resistance

Each exchange operates independently and maintains its own local economy.

---

### 2. Problem Statement

Global digital payment systems rely on centralized institutions such as banks, governments, or large corporations. These systems create several limitations:

* Financial exclusion for people without banking access
* High transaction fees
* Centralized control over financial activity
* Difficulty creating local community economies

LocalExchange addresses these issues by human-scale trust networks.

---

### 3. Core Concept

LocalExchange consists of many independent **exchanges**.

Each exchange:

* Is created by a single verified person
* Can contain up to **100 users**
* Allows transactions only between members of the same exchange
* Maintains its own internal currency

This design ensures that trust remains local and manageable.

---

### 4. Identity and Verification

Each exchange has a **human verifier**, typically the exchange creator.

User onboarding process:

1. User requests to join an exchange
2. Exchange creator verifies the identity
3. User becomes an approved member

This human verification layer significantly reduces identity fraud.

---

### 5. Local Currency Model

LocalExchange uses a **mutual credit system**.

Each user begins with a balance of zero.

When a transaction occurs:

Sender balance decreases

Receiver balance increases

Example:

Alice pays Bob 10 credits.

Balances become:

Alice = -10
Bob = +10

The total money supply remains zero across the exchange.
This model eliminates the need for currency issuance and prevents inflation.

---

### 6. Scalability Model

Instead of a single global network, LocalExchange scales through many small exchanges.

Example:

100 users per exchange

10,000 exchanges

Total potential users: 1,000,000

Because each exchange operates independently, the system avoids global bottlenecks.


## Count number of commits/day
```
git log main --pretty=format:'%ad' --date=short --numstat \
| awk '
NF==1 {date=$1; commits[date]++}
NF==3 {add[date]+=$1; del[date]+=$2}
END {
  for (d in commits)
    printf "%s | commits:%d | +%d | -%d\n", d, commits[d], add[d], del[d]
}' | sort
```