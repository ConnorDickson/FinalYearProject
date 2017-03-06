using DataCentreWebServer.IoC;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web.Http;

namespace DataCentreWebServer.Controllers
{
    public class VoiceRecognitionController : ApiController
    {
        public async Task<HttpResponseMessage> PostVoiceRequest()
        {
            var voiceRecognitionHandler = Container.ResolveVoiceRecognitionHandler();

            var returnMessage = await voiceRecognitionHandler.EvaluateVoiceRequest(Request);

            return returnMessage;
        }
    }
}
