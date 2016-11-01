using DataCentreWebServer.IoC;
using System.Net.Http;
using System.Web.Http;

namespace DataCentreWebServer.Controllers
{
    public class PythonController : ApiController
    {
        public HttpResponseMessage GetText()
        {
            var pythonRequestHandler = Container.ResolvePythonRequestHandler();

            return pythonRequestHandler.GenerateHttpResponse();
        }
    }
}
