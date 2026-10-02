# EC2 Setup Instructions

## 1. Connect to EC2 Instance via EC2 Instance Connect

## 2. Install Node Version Manager (nvm) and Node.js

- **Switch to superuser and install nvm:**

  ```
  sudo su -
  ```

  ```
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
  ```

- **Activate nvm:**

  ```
  . ~/.nvm/nvm.sh
  ```

- **Install the latest version of Node.js using nvm:**

  ```
  nvm install node
  ```

- **Verify that Node.js and npm are installed:**

  ```
  node -v
  ```

  ```
  npm -v
  ```

## 3. Install Git

- **Update the system and install Git:**

  ```
  sudo yum update -y
  ```

  ```
  sudo yum install git -y
  ```

- **Check Git version:**

  ```
  git --version
  ```

- **Clone your code repository from GitHub:**

  ```
  git clone [your-github-link]
  ```

- **Navigate to the directory and install packages:**

  ```
  cd project-management
  ```

  ```
  cd server
  ```

  ```
  npm i
  ```

- **Create Env File and Port 80:**

  ```
  echo "PORT=80" > .env
  ```

- **Start the application:**
  ```
  npm run dev
  ```

## 4. Install pm2 (Production Process Manager for Node.js)

- **Install pm2 globally:**

  ```
  npm i pm2 -g
  ```

- **Create a pm2 ecosystem configuration file (inside server directory):**

  ```
  module.exports = { apps : [{ name: 'inventory-management', script: 'npm', args: 'run dev', env: { NODE_ENV: 'development', ENV_VAR1: 'environment-variable', } }], };
  ```

- **Modify the ecosystem file if necessary:**

  ```
  nano ecosystem.config.js
  ```

- **Set pm2 to restart automatically on system reboot:**

  ```
  sudo env PATH=$PATH:$(which node) $(which pm2) startup systemd -u $USER --hp $(eval echo ~$USER)
  ```

- **Start the application using the pm2 ecosystem configuration:**

  ```
  pm2 start ecosystem.config.js
  ```

**Useful pm2 commands:**

- **Stop all processes:**

  ```
  pm2 stop all
  ```

- **Delete all processes:**

  ```
  pm2 delete all
  ```

- **Check status of processes:**

  ```
  pm2 status
  ```

- **Monitor processes:**
  ```
  pm2 monit
  ```

## Elasticsearch (search)

Search uses Elasticsearch with an automatic Postgres fallback, so the server runs fine without it.
Don't run Elasticsearch on the same small EC2 instance — use a managed cluster
(Amazon OpenSearch Service, or Elastic Cloud).

1. Provision the cluster and allow inbound access only from the EC2 instance's security group.
2. Add to `server/.env` on the instance:

   ```
   ELASTICSEARCH_URL=https://<your-cluster-endpoint>
   ELASTICSEARCH_API_KEY=<api-key>
   ```

3. Build the indices once, then restart:

   ```
   npm run reindex
   pm2 restart project-management
   ```

If the index ever drifts from Postgres (an index call failed, data edited directly), re-run `npm run reindex`.
