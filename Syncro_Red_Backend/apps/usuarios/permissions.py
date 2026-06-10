from rest_framework.permissions import BasePermission

ROLES_JEFATURA = {
    'ADMIN', 'GERENTE', 'GERENCIA',
    'IL', 'INSPECTOR DE LINEA',
    'SL', 'SUPERVISOR DE LINEA',
    'JEFE DE OPERACIONES', 'JEFE SERVICIO', 'JEFE DE SERVICIO',
}

ROLES_TRIPULACION = {'MAQUINISTA', 'AYUDANTE'}


def _cargo(user):
    return (getattr(user, 'cargo', '') or '').upper()


class IsJefaturaOSuperior(BasePermission):
    """Solo roles de jefatura, supervisión y administración."""

    message = 'Acceso restringido a jefatura y supervisión.'

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and _cargo(request.user) in ROLES_JEFATURA)


class IsTripulacion(BasePermission):
    """Solo maquinistas y ayudantes."""

    message = 'Acceso restringido a tripulación (maquinistas y ayudantes).'

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and _cargo(request.user) in ROLES_TRIPULACION)


class IsJefaturaOrTripulacion(BasePermission):
    """Cualquier usuario autenticado con cargo operacional."""

    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated
            and (_cargo(request.user) in ROLES_JEFATURA or _cargo(request.user) in ROLES_TRIPULACION)
        )


class IsAdminOrStaff(BasePermission):
    """Solo ADMIN o is_staff."""

    message = 'Acceso restringido a administradores.'

    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated
            and (request.user.is_staff or _cargo(request.user) == 'ADMIN')
        )


class IsPropioUsuarioOJefatura(BasePermission):
    """El usuario puede ver/editar sus propios datos; jefatura puede ver todos."""

    def has_object_permission(self, request, view, obj):
        if _cargo(request.user) in ROLES_JEFATURA or request.user.is_staff:
            return True
        rut_obj = getattr(obj, 'rut_trabajador_id', None) or getattr(obj, 'rut_id', None) or getattr(obj, 'rut', None)
        return str(rut_obj) == str(request.user.rut)
