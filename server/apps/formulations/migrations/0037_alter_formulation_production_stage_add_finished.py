from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("formulations", "0036_alter_formulation_production_stage_choices"),
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
                    ("finished", "Finished"),
                ],
                db_index=True,
                default="not_started",
                max_length=20,
                verbose_name="production stage",
            ),
        ),
    ]
