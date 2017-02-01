using System.Net;
using System.Net.Http;
using DataCentreWebServer.Helpers;

namespace DataCentreWebServer.RequestHandlers
{
    public class MachineLearningHandler
    {
        private MachineLearningHelper machineLearningHelper;

        public MachineLearningHandler(MachineLearningHelper machineLearningHelper)
        {
            this.machineLearningHelper = machineLearningHelper;
        }

        public HttpResponseMessage GenerateHttpResponse()
        {
            var machineLearningResponse = machineLearningHelper.GenerateResponse();
            var response = new HttpResponseMessage();
            response.StatusCode = HttpStatusCode.OK;
            response.Content = new StringContent("Machine learning from the Data Centre: " + machineLearningResponse);
            return response;
        }
    }
}