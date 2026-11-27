from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("formulations", "0035_alter_formulation_production_stage_help_text"),
    ]

    operations = [
        migrations.AlterField(
            model_name="formulation",
            name="production_stage",
            field=models.CharField(
                choices=[
                    ("not_started", "Not started"),
                    ("trial", "Trial batch"),
                    ("final_spec", "Final specification"),
                    ("payment", "Payment"),
                    ("label_design", "Label design"),
                    ("production", "Production"),
                ],
                db_index=True,
                default="not_started",
                max_length=20,
                verbose_name="production stage",
            ),
        ),
    ]
