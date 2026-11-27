from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("formulations", "0033_formulation_formulations_org_lead_sci_idx"),
    ]

    operations = [
        migrations.AddField(
            model_name="formulation",
            name="production_stage",
            field=models.CharField(
                choices=[
                    ("not_started", "Not started"),
                    ("payment_pending", "Payment pending"),
                    ("label_design", "Label design"),
                    ("procurement", "Procurement"),
                    ("production", "Production"),
                    ("quality_check", "Quality check"),
                    ("dispatch", "Dispatch"),
                    ("shipped", "Shipped"),
                ],
                db_index=True,
                default="not_started",
                max_length=20,
                verbose_name="production stage",
            ),
        ),
    ]
