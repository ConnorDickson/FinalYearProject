using DataCentreWebServer.IoC;
using System.Net.Http;
using System.Web.Http;

namespace DataCentreWebServer.Controllers
{
    public class VoiceRecognitionController : ApiController
    {
        public async System.Threading.Tasks.Task<HttpResponseMessage> Post()
        {
            var voiceRecognitionHandler = Container.ResolveVoiceRecognitionHandler();
            var returnMessage = await voiceRecognitionHandler.ReceivePostData(Request);
            return returnMessage;
        }

        public HttpResponseMessage GetText()
        {
            var voiceRecognitionHandler = Container.ResolveVoiceRecognitionHandler();

            return voiceRecognitionHandler.GenerateHttpResponse();
        }
    }
}
