# ---------------------------------------------------------------------------
# Billing guardrail (ADR-013): $5 AUD budget with 50/90/100% alerts.
#
# Created out-of-band via the billing REST API on 2026-09-21 (that was the
# only tooling available at the time); codified here 2026-10-20 so this
# directory is the complete reproducibility record.
#
# ONE-TIME BOOTSTRAP (out-of-band, needs billing-account owner):
# The CI SA can only manage budgets once it holds a billing role. Run this
# BEFORE the CI apply that creates this resource, then delete the 2026-09
# out-of-band budget (it has no config this file lacks):
#
#   gcloud billing accounts add-iam-policy-binding 013928-968C06-22424A \
#     --member="serviceAccount:github-ci@cloud-resume-challenge-509306.iam.gserviceaccount.com" \
#     --role="roles/billing.costsManager"
#   # (correct billing-account role for budget management; note
#   #   roles/billing.budgetsWriter does NOT exist as a grantable role on
#   #   billing accounts. If costsManager still 403s, use roles/billing.admin)
#
#   gcloud billing budgets list --billing-account=013928-968C06-22424A
#   gcloud billing budgets delete <ID> --billing-account=013928-968C06-22424A
#
# (Alternative to deleting: terraform import the existing budget; delete +
# recreate from this file is simpler and keeps a single clean state entry.)
#
# After the grant + deletion, re-run the backend pipeline:
#   gh workflow run backend.yml -R hxrsh159/cloud-resume-challenge
#
# Deliberately NOT a google_billing_account_iam_member resource: managing
# billing-account IAM requires an applier that already holds billing IAM
# rights, which CI never has (bootstrap stays manual, documented here).
# ---------------------------------------------------------------------------

resource "google_billing_budget" "guardrail" {
  billing_account = "billingAccounts/${var.billing_account_id}"
  display_name    = "resume-site-guardrail"

  budget_filter {
    projects = ["projects/${var.project_number}"]
  }

  amount {
    specified_amount {
      currency_code = "AUD"
      units         = "5"
    }
  }

  # Email alerts at 50/90/100% of current spend (ADR-013 spec).
  threshold_rules {
    threshold_percent = 0.5
  }
  threshold_rules {
    threshold_percent = 0.9
  }
  threshold_rules {
    threshold_percent = 1.0
  }
}
