# Generated manually to fix estado field length

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('usuarios', '0003_registrooperativo_grafico_apertura_hora_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='registrooperativo',
            name='estado',
            field=models.CharField(
                max_length=30,
                choices=[
                    ('PENDIENTE', 'Pendiente'),
                    ('PENDIENTE_AUTORIZACION', 'Pendiente Autorización IL'),
                    ('CONFIRMADO', 'Confirmado'),
                    ('RECHAZADO', 'Rechazado'),
                ],
                default='PENDIENTE'
            ),
        ),
    ]
