from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('bitacora', '0003_add_reporte_detallado_hashes'),
    ]

    operations = [
        migrations.AddField(
            model_name='reportefinal',
            name='maquinista',
            field=models.CharField(blank=True, max_length=150),
        ),
        migrations.AddField(
            model_name='reportefinal',
            name='ayudante',
            field=models.CharField(blank=True, max_length=150),
        ),
    ]
