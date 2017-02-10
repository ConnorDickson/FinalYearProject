using DataCentreWebServer.IoC;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web.Http;

namespace DataCentreWebServer.Controllers
{
    public class MachineLearningController : ApiController
    {
        public async Task<HttpResponseMessage> ProcessInfo()
        {
            var machineLearningHandler = Container.ResolveMachineLearningHandler();

            return await machineLearningHandler.ProcessRequest(Request);
        }

        public HttpResponseMessage GetResults()
        {
            var machineLearningHandler = Container.ResolveMachineLearningHandler();

            return machineLearningHandler.GenerateHttpResponse();
        }
    }
}
