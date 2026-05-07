import axios from 'axios';

/**
 * Instancia de Axios configurada para realizar llamadas a la API de TriggerKey.
 * Utiliza rutas relativas para compatibilidad tanto en el proxy de desarrollo de Vite como servido directo por Flask.
 * @type {import('axios').AxiosInstance}
 */
const API = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Obtiene el estado actual del sistema (ej. si está grabando, reproduciendo o la tecla de pánico activa).
 * 
 * @async
 * @function getStatus
 * @returns {Promise<{playing: boolean, recording: boolean, status: string}>} Objeto con el estado del backend.
 */
export const getStatus = async () => {
  const response = await API.get('/api/status');
  return response.data;
};

/**
 * Recupera la lista de todas las macros guardadas en el ordenador.
 * 
 * @async
 * @function getMacros
 * @returns {Promise<Array<{name: string, steps_count: number, trigger_key: string|null}>>} Lista de objetos macro.
 */
export const getMacros = async () => {
  const response = await API.get('/api/macros');
  return response.data;
};

/**
 * Obtiene los detalles y pasos de una macro guardada específica según su nombre.
 * 
 * @async
 * @function getMacro
 * @param {string} name - Nombre único de la macro que se desea recuperar.
 * @returns {Promise<{name: string, trigger_key: string|null, steps: Array<Object>}>} Objeto con la configuración y pasos de la macro.
 */
export const getMacro = async (name) => {
  const response = await API.get(`/api/macros/${name}`);
  return response.data;
};

/**
 * Guarda o actualiza una macro en la base de datos local con su conjunto de pasos y atajo de teclado opcional.
 * 
 * @async
 * @function saveMacro
 * @param {string} name - Nombre que identificará a la macro.
 * @param {Array<Object>} steps - Lista ordenada de pasos/acciones que conforman el flujo.
 * @param {string|null} [triggerKey=null] - Atajo de teclado global (ej. 'ctrl+alt+a') para disparar el flujo en segundo plano.
 * @returns {Promise<{success: boolean, message: string}>} Respuesta de confirmación del guardado.
 */
export const saveMacro = async (name, steps, triggerKey = null) => {
  const response = await API.post('/api/macros', { name, steps, trigger_key: triggerKey });
  return response.data;
};

/**
 * Elimina de forma permanente una macro guardada en el sistema.
 * 
 * @async
 * @function deleteMacro
 * @param {string} name - Nombre único de la macro que se desea eliminar.
 * @returns {Promise<{success: boolean, message: string}>} Confirmación de eliminación del archivo.
 */
export const deleteMacro = async (name) => {
  const response = await API.delete(`/api/macros/${name}`);
  return response.data;
};

/**
 * Inicia el proceso de grabación física en tiempo real de eventos de teclado y ratón.
 * 
 * @async
 * @function startRecording
 * @returns {Promise<{success: boolean, message: string}>} Estado de inicio del capturador de eventos.
 */
export const startRecording = async () => {
  const response = await API.post('/api/record/start');
  return response.data;
};

/**
 * Detiene la grabación actual y opcionalmente la guarda con un nombre específico en el almacenamiento.
 * 
 * @async
 * @function stopRecording
 * @param {string|null} [name=null] - Nombre para la macro recién grabada. Si es null, detiene sin guardar.
 * @returns {Promise<{success: boolean, name?: string, steps?: Array<Object>}>} Resultado de la detención de grabación.
 */
export const stopRecording = async (name = null) => {
  const response = await API.post('/api/record/stop', { name });
  return response.data;
};

/**
 * Reproduce de forma automática una macro guardada por su nombre único.
 * 
 * @async
 * @function playMacro
 * @param {string} name - Nombre de la macro que se desea reproducir.
 * @returns {Promise<{success: boolean, message: string}>} Estado de inicio de reproducción física en el sistema operativo.
 */
export const playMacro = async (name) => {
  const response = await API.post(`/api/play/${name}`);
  return response.data;
};

/**
 * Prueba y reproduce un conjunto de pasos de forma inmediata sin necesidad de guardarlo previamente.
 * 
 * @async
 * @function playSteps
 * @param {Array<Object>} steps - Conjunto de pasos secuenciales a ejecutar de inmediato.
 * @returns {Promise<{success: boolean, message: string}>} Estado del inicio de ejecución instantánea.
 */
export const playSteps = async (steps) => {
  const response = await API.post('/api/play/steps', { steps });
  return response.data;
};

/**
 * Detiene forzosamente cualquier reproducción de macro o acción que se esté ejecutando actualmente (Botón de pánico).
 * 
 * @async
 * @function stopAction
 * @returns {Promise<{success: boolean, message: string}>} Confirmación de detención de todos los hilos del robot.
 */
export const stopAction = async () => {
  const response = await API.post('/api/stop');
  return response.data;
};

/**
 * Obtiene la coordenada exacta del cursor del ratón (ejes X e Y) tras un pequeño retraso de posicionamiento.
 * 
 * @async
 * @function getMousePosition
 * @returns {Promise<{x: number, y: number}>} Par de ejes cartesianos del cursor en píxeles.
 */
export const getMousePosition = async () => {
  const response = await API.get('/api/mouse/position');
  return response.data;
};

export default {
  getStatus,
  getMacros,
  getMacro,
  saveMacro,
  deleteMacro,
  startRecording,
  stopRecording,
  playMacro,
  playSteps,
  stopAction,
  getMousePosition,
};
