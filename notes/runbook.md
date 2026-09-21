# Runbook

Commands verified working. Run from repo root unless noted.

## Auth (one-time per machine)

```bash
gcloud auth application-default login   # ADC for Terraform + firebase-tools
```

## Terraform (terraform/)

```bash
terraform init -upgrade
terraform plan -out=tfplan
terraform apply tfplan
terraform output                          # URLs + DNS records Firebase wants
terraform output -json dns_records_to_create
terraform refresh                         # re-poll Firebase DNS/cert status
```

## Frontend deploy

```bash
GOOGLE_APPLICATION_CREDENTIALS="$HOME/.config/gcloud/application_default_credentials.json" \
  npx -y firebase-tools@latest deploy --only hosting --project cloud-resume-challenge-509306 --non-interactive
```

## Verify

```bash
curl -sI https://theozdev.web.app/        # 200 + strict-transport-security
dig +short theozdev.com A @1.1.1.1        # expect 199.36.158.100
dig +short theozdev.com TXT @1.1.1.1      # expect "hosting-site=theozdev"
curl -sI https://theozdev.com/            # 200 once cert issued
```

## Backend (backend/)

```bash
cargo build                                # local compile check
GCP_PROJECT_ID=cloud-resume-challenge-509306 cargo run   # uses gcloud ADC
curl -s http://localhost:8080/api/visitors # {"count":N}

podman build -t resume-api .               # distroless image (~9 MB)
# container needs creds at gcloud well-known path (see notes/decisions.md ADR-007 quirk):
podman run -p 8081:8080 -e GCP_PROJECT_ID=cloud-resume-challenge-509306 \
  -v "/tmp/adc.json:/home/nonroot/.config/gcloud/application_default_credentials.json:ro,Z" \
  resume-api
```

## Extract resume ODT to text

```bash
unzip -p ~/Documents/Resume.odt content.xml | python3 -c "
import sys, re, html
x = sys.stdin.read()
x = re.sub(r'</text:(p|h)>', '\n', x)
x = re.sub(r'<[^>]+>', '', x)
print(html.unescape(x))"
```

## DNS records (Cloudflare dashboard, both grey-cloud)

- A     @ -> 199.36.158.100
- TXT   @ -> hosting-site=theozdev

## Firebase console

https://console.firebase.google.com/project/cloud-resume-challenge-509306/hosting

## Agent environment changes (2026-09-21)

- Cloudflare skills installed to ~/.agents/skills (15 skills)
- Cloudflare MCP servers added to ~/.config/opencode/opencode.json
  (cloudflare, cloudflare-docs, cloudflare-bindings, cloudflare-builds,
  cloudflare-observability); core `cloudflare` OAuth completed
