# Setting Up Amazon RDS (PostgreSQL)

This README documents the steps and configuration used to provision the RDS instance for this project (`pm-rds`), including every setting that was changed from the AWS default.

## Overview

- **Engine:** PostgreSQL 18.3-R2
- **Deployment:** Single-AZ, Free Tier template
- **Instance identifier:** `pm-rds`
- **Initial database:** `projectmanagement`
- **Access:** Private only (no public access) — reachable from resources inside the VPC, e.g. the backend EC2 instance

---

## 1. Choose a template

**Console path:** RDS → Databases → Create database → Standard create

| Setting | Value chosen | Default |
|---|---|---|
| Template | **Free tier** | Production |

Free tier was selected to avoid unnecessary cost during development. Note this template forces some options below (e.g. Single-AZ, no storage autoscaling) regardless of what you'd normally pick.

## 2. Availability and durability

| Setting | Value chosen | Default |
|---|---|---|
| Deployment option | **Single-AZ DB instance deployment (1 instance)** | Multi-AZ DB instance deployment |

This gives 99.5% uptime with **no data redundancy** — there's no standby instance. Fine for dev/test, but this is the first thing to change before going to production (switch to Multi-AZ for automatic failover).

## 3. Settings

| Setting | Value chosen | Default |
|---|---|---|
| Engine version | **PostgreSQL 18.3-R2** | latest recommended version |
| Enable RDS Extended Support | **Unchecked** | Unchecked |
| DB instance identifier | **`pm-rds`** | — |
| Master username | **`postgres`** | `postgres` |
| Credentials management | **Self managed** | Managed in AWS Secrets Manager |
| Auto generate password | **Unchecked** (manual password set) | Unchecked |

> **Note:** Credentials management was switched to *Self managed* instead of the more secure Secrets Manager option — the master password is set and known manually, not rotated/stored by AWS. Store this password somewhere safe (password manager or `.env`, never committed to git).

## 4. Instance configuration

| Setting | Value chosen | Default |
|---|---|---|
| DB instance class | **Burstable classes (t classes)** | Standard classes (m classes) |
| Instance type | **db.t4g.micro** (2 vCPUs, 1 GiB RAM) | — |

## 5. Storage

| Setting | Value chosen | Default |
|---|---|---|
| Storage type | **General Purpose SSD (gp2)** | General Purpose SSD (gp3) |
| Allocated storage | **20 GiB** | 20 GiB |
| Storage autoscaling | **Disabled** | Enabled |

Storage autoscaling was left off — if the database fills up past 20 GiB, it will need to be resized manually rather than growing automatically.

## 6. Connectivity

| Setting | Value chosen | Default |
|---|---|---|
| Compute resource | **Don't connect to an EC2 compute resource** | Don't connect |
| VPC | **`pm_vpc` (vpc-07b33bffa35c2c6fb)** — 3 subnets, 2 AZs | — |
| DB subnet group | **Create new DB Subnet Group** | — |
| Public access | **No** | No |
| VPC security group | **Create new** — `pm_rds_security_group` | Create new |

Public access is disabled, so the database is **only reachable from inside the VPC** — this is the correct setting for a backend EC2 instance that lives in the same VPC.

> **Important follow-up step (not shown in screenshots):** After creation, go to the new `pm_rds_security_group` and add an inbound rule allowing PostgreSQL traffic (port 5432) from your EC2 instance's security group — otherwise your EC2 backend won't be able to connect even though it's in the same VPC.

## 7. Database authentication / RDS Proxy / Certificate

| Setting | Value chosen | Default |
|---|---|---|
| Create an RDS Proxy | **Unchecked** | Unchecked |
| Certificate authority | **rds-ca-rsa2048-g1 (default)**, expires May 25, 2061 | rds-ca-rsa2048-g1 |

## 8. Monitoring

| Setting | Value chosen | Default |
|---|---|---|
| Database Insights | **Standard** (7 days retention, free) | Standard |
| Enhanced Monitoring | **Disabled** | Disabled |
| Log exports (CloudWatch) | **None selected** (iam-db-auth-error, PostgreSQL log, Upgrade log all unchecked) | None |
| DevOps Guru | **Off** | Off |
| AWS KMS key | **(default) aws/rds** | (default) aws/rds |

No logs are being exported to CloudWatch — worth revisiting later for debugging/auditing in production.

## 9. Additional configuration

| Setting | Value chosen | Default |
|---|---|---|
| Initial database name | **`projectmanagement`** | (none — RDS won't create a DB if left blank) |
| DB parameter group | **default.postgres18** | default.postgres18 |
| Option group | default:postgres-18 | default:postgres-18 |
| Enable encryption | **Checked** (default aws/rds KMS key) | Checked |
| Enable automated backup | **Unchecked** | Checked |
| Copy tags to automated backup | Unchecked | Unchecked |

> **Note:** Automated backups are **turned off**. There's no point-in-time recovery for this instance. Acceptable for dev/test, but this must be turned on before storing real user data.

---

## Summary of things to revisit before production

- [ ] Switch to **Multi-AZ** deployment for automatic failover
- [ ] Move credentials to **AWS Secrets Manager**
- [ ] Turn on **automated backups**
- [ ] Enable **storage autoscaling**
- [ ] Add inbound rule to `pm_rds_security_group` allowing port 5432 from the EC2 security group
- [ ] Consider enabling log exports (PostgreSQL log at minimum) for debugging

## Connecting from EC2

Once the security group rule above is added, connect from your EC2 instance using:

```bash
psql -h <rds-endpoint> -U postgres -d projectmanagement -p 5432
```

The RDS endpoint is available on the database's detail page in the console after creation (**Connectivity & security** tab).
