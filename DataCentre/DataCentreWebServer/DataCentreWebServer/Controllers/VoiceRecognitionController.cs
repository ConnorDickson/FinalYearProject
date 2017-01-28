using DataCentreWebServer.IoC;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web.Http;

namespace DataCentreWebServer.Controllers
{
    public class VoiceRecognitionController : ApiController
    {
        public async Task<HttpResponseMessage> PostForProcessingData()
        {
            var voiceRecognitionHandler = Container.ResolveVoiceRecognitionHandler();
            var returnMessage = await voiceRecognitionHandler.ReceivePostDataForProcessing(Request);
            return returnMessage;
        }

        public async Task<HttpResponseMessage> PostForPreProcessedData()
        {
            var voiceRecognitionHandler = Container.ResolveVoiceRecognitionHandler();
            var returnMessage = await voiceRecognitionHandler.ReceivePreProcessedPostData(Request);
            return returnMessage;
        }
    }
}
