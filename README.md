# Vita CFF — Production version

This is the version **currently running on Azure** at **https://npd.vitaintelligent.com**.

It was snapshotted from the `vita-intelligence/vita-cff` repository at the `prod-2026-10-14` tag
(commit `5b24793`, deployed 14 October 2026). The `vita-cff` repo has since diverged significantly
with PSP and MRPEasy integrations that depend on systems no longer in operation — use this
repository for all maintenance and deployments going forward.

---

## Architecture

| Component | Technology | Runs on |
|-----------|-----------|---------|
| Backend   | Django + Uvicorn | Azure App Service (`vita-npd-backend`, resource group `Vita_NPD`) |
| Frontend  | Next.js | Azure App Service (`vita-npd-frontend`, resource group `Vita_NPD`) |
| Database  | PostgreSQL Flexible Server | Azure (`vita-npd-db`, resource group `Vita_NPD`) |
| Storage   | Azure Blob Storage | `vitanpdstorage` |

Both services run as Docker containers pulled from Docker Hub. To deploy a change:
build a new image → push it to Docker Hub → restart the App Service so Azure pulls it.

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli) (`az`) installed
- A Docker Hub account (see below)

### Windows note

`deploy.sh` is a Bash script. On Windows you have two options:

**Option A — WSL2 (recommended).** Install [WSL2](https://learn.microsoft.com/en-us/windows/wsl/install)
with Ubuntu, then install Docker Desktop with the WSL2 backend enabled. Run all commands from
inside the WSL2 terminal. `az` and `docker` both work inside WSL2 once installed there.

**Option B — Git Bash.** Install [Git for Windows](https://gitforwindows.org/) which ships Git Bash.
Open Git Bash, make sure Docker Desktop is running, and run `./deploy.sh` from there.
`az` must also be installed (use the Windows MSI installer from the link above) and will be
available in Git Bash automatically.

Everything else (`az login`, `docker login`, log tailing) works identically in either environment.

---

## First-time setup: transfer Docker Hub images

The backend and frontend images are currently stored under the previous developer's Docker
Hub account. Before deploying, transfer them to your own account:

1. **Create a Docker Hub account** at https://hub.docker.com and note your username (e.g. `yourname`).

2. **Create two public repositories** on Docker Hub:
   - `yourname/vita-npd-backend`
   - `yourname/vita-npd-frontend`

3. **Update the image names in the repo** — two files need changing:

   `deploy.sh` (line 25):
   ```
   BACKEND_IMAGE="${BACKEND_IMAGE:-yourname/vita-npd-backend:latest}"
   ```

   `client/build-and-push.sh` (line 13):
   ```
   IMAGE="${IMAGE:-yourname/vita-npd-frontend:latest}"
   ```

4. **Update Azure App Service container settings** so both services pull from your new images.
   Do this in the Azure portal for each App Service:

   - Open [portal.azure.com](https://portal.azure.com) → Resource group **Vita_NPD**
   - Click **vita-npd-backend** → **Configuration** → **Container settings**
   - Change Image and tag from `maksymcherhyk/vita-npd-backend:latest` to `yourname/vita-npd-backend:latest`
   - Save, then repeat for **vita-npd-frontend** (`yourname/vita-npd-frontend:latest`)

   Or via CLI (replace `yourname`):
   ```bash
   az webapp config container set \
       --name vita-npd-backend --resource-group Vita_NPD \
       --docker-custom-image-name yourname/vita-npd-backend:latest

   az webapp config container set \
       --name vita-npd-frontend --resource-group Vita_NPD \
       --docker-custom-image-name yourname/vita-npd-frontend:latest
   ```

5. **Log in to Docker Hub** on your machine:
   ```bash
   docker login
   ```

---

## Deploying a change

Run from the repo root:

```bash
./deploy.sh
```

This does four things in order:
1. Builds the backend image for `linux/amd64` and pushes it to Docker Hub
2. Builds the frontend image (with the backend URL baked in) and pushes it
3. Restarts `vita-npd-backend` on Azure (triggers a fresh pull from Docker Hub)
4. Restarts `vita-npd-frontend` on Azure

You need to be logged into Azure (`az login`) and Docker Hub (`docker login`) before running it.

### Deploy only images, restart manually

```bash
./deploy.sh --skip-restart
```

Then restart from the portal: App Service → **Restart** button.

### Deploy only one service

```bash
# backend only
cd server
docker buildx build --platform linux/amd64 -t yourname/vita-npd-backend:latest --push .
az webapp restart --name vita-npd-backend --resource-group Vita_NPD

# frontend only
cd client
./build-and-push.sh
az webapp restart --name vita-npd-frontend --resource-group Vita_NPD
```

---

## Environment variables

All secrets and config live in Azure App Service → **Configuration → Application settings**.
See `server/.env.example` for a full list with descriptions.

To add or change a variable:
```bash
az webapp config appsettings set \
    --name vita-npd-backend --resource-group Vita_NPD \
    --settings KEY=value
```

---

## Monitoring logs

```bash
# Backend live log stream
az webapp log tail --name vita-npd-backend --resource-group Vita_NPD

# Frontend live log stream
az webapp log tail --name vita-npd-frontend --resource-group Vita_NPD
```

---

## Database

Production PostgreSQL runs on Azure (`vita-npd-db.postgres.database.azure.com`).
The connection string is stored in the `DATABASE_URL` app setting — never commit it.

To allow your machine to connect directly (e.g. for a one-off Django shell command),
add your IP to the PostgreSQL firewall first:

```bash
MY_IP=$(curl -s https://api.ipify.org)
az postgres flexible-server firewall-rule create \
    --name vita-npd-db --resource-group Vita_NPD \
    --rule-name "my-access" \
    --start-ip-address "$MY_IP" --end-ip-address "$MY_IP"
```

---

## Running locally

No external services needed — the backend falls back to SQLite in dev.

```bash
# Backend
cd server
python3.13 -m venv .venv          # Python 3.12+ required
.venv/bin/pip install -r requirements/base.txt
.venv/bin/python manage.py migrate
.venv/bin/python manage.py runserver

# Frontend (separate terminal)
cd client
echo 'NEXT_PUBLIC_API_URL=http://127.0.0.1:8000' > .env.local
npm install
npm run dev
```

Then open http://localhost:3000. Create an initial user via the Django shell:

```bash
.venv/bin/python manage.py shell -c "
from apps.accounts.models import User
from apps.organizations.models import Organization, Membership
u = User.objects.create_superuser('you@example.com', 'yourpassword', first_name='Your', last_name='Name')
org = Organization.objects.create(name='Vita Manufacture Limited', created_by=u, is_active=True)
Membership.objects.create(user=u, organization=org, is_owner=True)
"
```
