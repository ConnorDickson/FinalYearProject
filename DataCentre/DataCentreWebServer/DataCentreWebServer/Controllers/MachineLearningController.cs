using DataCentreWebServer.IoC;
using System.Net.Http;
using System.Web.Http;

namespace DataCentreWebServer.Controllers
{
    public class MachineLearningController : ApiController
    {
        public HttpResponseMessage ProcessInfo()
        {
            var machineLearningHandler = Container.ResolveMachineLearningHandler();

            return machineLearningHandler.GenerateHttpResponse();
        }
    }
}
