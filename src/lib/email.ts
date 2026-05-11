import { Resend } from 'resend';

// Solo inicializamos si la API KEY existe para evitar errores en dev sin env
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export const sendConfirmationEmail = async (talk: any) => {
  if (!resend) {
    console.warn('RESEND_API_KEY no configurada. Saltando envío de email.');
    return { success: false, error: 'API Key missing' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'Chelaxlaciencia <onboarding@resend.dev>', // Dominio de prueba de Resend
      to: [talk.email],
      subject: `✅ Propuesta recibida - ${talk.title.toUpperCase()}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333; border: 1px solid #eee; padding: 20px; border-radius: 15px;">
          <h2 style="color: #9933FF; text-align: center;">¡Hola ${talk.speaker_name}!</h2>
          <p>Hemos recibido correctamente tu propuesta para participar en <strong>Una chela por la ciencia</strong> en Casa Pädi.</p>
          
          <div style="background: #f9f9f9; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h3 style="margin-top: 0; font-size: 16px;">Resumen de tu propuesta:</h3>
            <p style="margin: 5px 0;"><strong>Título:</strong> ${talk.title}</p>
            <p style="margin: 5px 0;"><strong>Categoría:</strong> ${talk.category || 'General'}</p>
            <p style="margin: 5px 0;"><strong>1ª Opción:</strong> ${talk.preferred_date_1 || 'No especificada'}</p>
            <p style="margin: 5px 0;"><strong>2ª Opción:</strong> ${talk.preferred_date_2 || 'No especificada'}</p>
          </div>
          
          <p><strong>¿Qué sigue?</strong> Nuestro equipo revisará los detalles y nos pondremos en contacto contigo a través de este correo o por teléfono para coordinar la fecha definitiva y los detalles técnicos.</p>
          
          <p style="text-align: center; margin-top: 30px;">
            <a href="https://chelaxlaciencia.vercel.app" style="background: #9933FF; color: white; padding: 12px 25px; text-decoration: none; border-radius: 25px; font-weight: bold;">Visitar Cartelera</a>
          </p>
          
          <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
          
          <div style="text-align: center; font-size: 12px; color: #888;">
            <p><strong>Casa Pädi - Pachuca, Hidalgo</strong></p>
            <p>Av. Piracantos 1507, Pachuca de Soto.</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Error de Resend:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (err) {
    console.error('Error inesperado al enviar email:', err);
    return { success: false, error: err };
  }
};
