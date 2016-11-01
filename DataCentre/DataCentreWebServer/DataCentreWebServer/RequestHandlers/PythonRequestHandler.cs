using System.Net;
using System.Net.Http;

namespace DataCentreWebServer.RequestHandlers
{
    public class PythonRequestHandler
    {
        public HttpResponseMessage GenerateHttpResponse()
        {
            var response = new HttpResponseMessage();
            response.StatusCode = HttpStatusCode.OK;
            response.Content = new StringContent("This is a string returned from WebAPI");
            return response;
        }
    }
}