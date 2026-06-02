from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('bitacora', '0002_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='reportefinal',
            name='reporte_detallado',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='reportefinal',
            name='hash_simple',
            field=models.CharField(blank=True, max_length=64),
        ),
        migrations.AddField(
            model_name='reportefinal',
            name='hash_detallado',
            field=models.CharField(blank=True, max_length=64),
        ),
    ]
