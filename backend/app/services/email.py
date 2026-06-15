import logging
import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException
from app.config import settings

logger = logging.getLogger(__name__)


def _get_api():
    configuration = sib_api_v3_sdk.Configuration()
    configuration.api_key["api-key"] = settings.BREVO_API_KEY
    return sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(configuration))


def send_email(to_email: str, to_name: str, subject: str, html_content: str) -> bool:
    if not settings.BREVO_API_KEY:
        logger.warning("BREVO_API_KEY not set — skipping email to %s", to_email)
        return False
    try:
        api = _get_api()
        send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
            to=[{"email": to_email, "name": to_name}],
            sender={"email": settings.SMTP_FROM, "name": settings.SMTP_FROM_NAME},
            subject=subject,
            html_content=html_content,
        )
        api.send_transac_email(send_smtp_email)
        logger.info("Email sent to %s — %s", to_email, subject)
        return True
    except ApiException as e:
        logger.error("Brevo API error: %s", e)
        return False


def send_new_case_business(case_id: int, customer_name: str, plate: str, service_type: str):
    if not settings.BUSINESS_EMAIL:
        return
    subject = f"[DocuCars] Nuevo caso #{case_id} — {plate}"
    html = f"""
    <h2>Nuevo caso recibido</h2>
    <table>
      <tr><td><b>ID:</b></td><td>#{case_id}</td></tr>
      <tr><td><b>Cliente:</b></td><td>{customer_name}</td></tr>
      <tr><td><b>Placa:</b></td><td>{plate}</td></tr>
      <tr><td><b>Trámite:</b></td><td>{service_type.replace('_', ' ')}</td></tr>
    </table>
    <p>Ingresa al dashboard para revisar el caso.</p>
    """
    send_email(settings.BUSINESS_EMAIL, "DocuCars Admin", subject, html)


def send_confirmation_client(case_id: int, customer_name: str, customer_email: str, service_type: str):
    subject = f"[DocuCars] Confirmación de solicitud #{case_id}"
    html = f"""
    <h2>Hola {customer_name},</h2>
    <p>Recibimos tu solicitud de trámite exitosamente.</p>
    <table>
      <tr><td><b>Número de caso:</b></td><td>#{case_id}</td></tr>
      <tr><td><b>Trámite:</b></td><td>{service_type.replace('_', ' ')}</td></tr>
    </table>
    <p>Te contactaremos pronto. Si tienes dudas, responde a este correo.</p>
    <p>— Equipo DocuCars</p>
    """
    send_email(customer_email, customer_name, subject, html)


def send_sla_alert(case_id: int, customer_name: str, plate: str, minutes_elapsed: int):
    if not settings.BUSINESS_EMAIL:
        return
    subject = f"[ALERTA] Caso #{case_id} sin atender — {minutes_elapsed} min"
    html = f"""
    <h2 style="color:red;">Alerta SLA</h2>
    <p>El caso <b>#{case_id}</b> lleva <b>{minutes_elapsed} minutos</b> sin ser atendido.</p>
    <table>
      <tr><td><b>Cliente:</b></td><td>{customer_name}</td></tr>
      <tr><td><b>Placa:</b></td><td>{plate}</td></tr>
    </table>
    <p>Por favor atiéndelo lo antes posible.</p>
    """
    send_email(settings.BUSINESS_EMAIL, "DocuCars Admin", subject, html)
