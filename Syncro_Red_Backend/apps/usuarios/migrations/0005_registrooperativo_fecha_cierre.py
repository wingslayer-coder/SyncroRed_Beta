# Generated manually for fecha_cierre field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('usuarios', '0004_alter_registrooperativo_estado'),
    ]

    operations = [
        migrations.AddField(
            model_name='registrooperativo',
            name='fecha_cierre',
            field=models.DateField(null=True, blank=True),
        ),
    ]
