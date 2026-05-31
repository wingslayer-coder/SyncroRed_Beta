from django.core.management.base import BaseCommand
from apps.usuarios.models import Usuario
from apps.prevenciones.models import EstacionVia


class Command(BaseCommand):
    help = 'Seed initial data: stations/vias and test users'

    def handle(self, *args, **options):
        self.seed_estaciones_vias()
        self.seed_usuarios()
        self.stdout.write(self.style.SUCCESS('Seed completed successfully'))

    def seed_estaciones_vias(self):
        filas = []
        # LM (Lomas Coloradas)
        filas.append(("LM", "V1", "-", "LM V1", "Lomas Coloradas Vía 1"))
        filas.append(("LM", "V2", "-", "LM V2", "Lomas Coloradas Vía 2"))
        filas.append(("LM", "V3", "-", "LM V3", "Lomas Coloradas Vía 3"))
        filas.append(("LM", "V3", "CW", "LM V3/CW", "Lomas Coloradas Vía 3 lado Coronel"))
        filas.append(("LM", "V3", "CC", "LM V3/CC", "Lomas Coloradas Vía 3 lado Concepción"))

        # GU (Gualpencillo)
        filas.append(("GU", "V4", "-", "GU V4", "Gualpencillo Vía 4"))
        filas.append(("GU", "V4", "N", "GU V4/N", "Gualpencillo Vía 4 Norte"))
        filas.append(("GU", "V4", "C", "GU V4/C", "Gualpencillo Vía 4 Centro"))
        filas.append(("GU", "V4", "S", "GU V4/S", "Gualpencillo Vía 4 Sur"))

        # HQ (Hualqui)
        for v in ("V1", "V2", "V4", "V6", "V8"):
            filas.append(("HQ", v, "-", f"HQ {v}", f"Hualqui Vía {v[1]}"))
        filas.append(("HQ", "V4", "QU", "HQ V4 QU", "Hualqui Vía 4 lado Quilacoya"))
        filas.append(("HQ", "V4", "ZW", "HQ V4 ZW", "Hualqui Vía 4 lado Leonera"))

        # EZ (El Arenal)
        for v in ("V1", "V2", "V4"):
            filas.append(("EZ", v, "-", f"EZ {v}", f"El Arenal Vía {v[1]}"))
        for v in ("V1", "V2"):
            for p in ("P1", "P2", "P3", "P4", "P5"):
                filas.append(("EZ", v, p, f"EZ {v}/{p}", f"El Arenal Vía {v[1]} {p}"))
        filas.append(("EZ", "V4", "N", "EZ V4/N", "El Arenal Vía 4 Norte"))
        filas.append(("EZ", "V4", "S", "EZ V4/S", "El Arenal Vía 4 Sur"))

        # OT (Omer Huet)
        for v in ("V1", "V2", "V4"):
            filas.append(("OT", v, "-", f"OT {v}", f"Omer Huet Vía {v[1]}"))

        # LP (La Leonera)
        for v in ("V1", "V2", "V4"):
            filas.append(("LP", v, "-", f"LP {v}", f"La Leonera Vía {v[1]}"))

        # SM (San Miguel)
        for v in ("V1", "V2", "V4"):
            filas.append(("SM", v, "-", f"SM {v}", f"San Miguel Vía {v[1]}"))

        # QY (Quilacoya)
        for v in ("V1", "V2", "V4"):
            filas.append(("QY", v, "-", f"QY {v}", f"Quilacoya Vía {v[1]}"))

        created = 0
        for estacion, via, posicion, etiqueta, descripcion in filas:
            obj, was_created = EstacionVia.objects.get_or_create(
                estacion=estacion, via=via, posicion=posicion,
                defaults={'etiqueta': etiqueta, 'descripcion': descripcion}
            )
            if was_created:
                created += 1

        self.stdout.write(f"  Estaciones/Vias: {created} created, {len(filas)} total")

    def seed_usuarios(self):
        usuarios_data = [
            ('22222222-2', 'Juan', 'Pérez', 'IL', 'il123'),
            ('33333333-3', 'María', 'González', 'SL', 'sl123'),
            ('44444444-4', 'Pedro', 'Soto', 'JEFE DE OPERACIONES', 'jo123'),
            ('55555555-5', 'Ana', 'López', 'JEFE DE SERVICIO', 'js123'),
            ('66666666-6', 'Carlos', 'Díaz', 'MAQUINISTA', 'maq123'),
            ('77777777-7', 'Laura', 'Torres', 'AYUDANTE', 'ayu123'),
            ('88888888-8', 'Roberto', 'Méndez', 'GERENTE', 'ger123'),
        ]

        created = 0
        for rut, nombre, apellido, cargo, pwd in usuarios_data:
            if not Usuario.objects.filter(rut=rut).exists():
                Usuario.objects.create_user(
                    rut=rut, password=pwd,
                    nombre=nombre, apellido=apellido, cargo=cargo
                )
                created += 1

        self.stdout.write(f"  Usuarios: {created} created, {len(usuarios_data)} total")
