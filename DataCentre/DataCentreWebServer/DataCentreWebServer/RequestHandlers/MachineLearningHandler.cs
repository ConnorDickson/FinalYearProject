using System.Net;
using System.Net.Http;
using DataCentreWebServer.Helpers;
using System.Threading.Tasks;
using Newtonsoft.Json;
using DataCentreWebServer.MachineLearning;

namespace DataCentreWebServer.RequestHandlers
{
    public class MachineLearningHandler
    {
        private MachineLearningHelper _machineLearningHelper;
        private FileSystemHelper _fileSystemHelper;

        public MachineLearningHandler(MachineLearningHelper machineLearningHelper, FileSystemHelper fileSystemHelper)
        {
            _machineLearningHelper = machineLearningHelper;
            _fileSystemHelper = fileSystemHelper;
        }

        public async Task<HttpResponseMessage> GenerateHttpResponse(HttpRequestMessage request)
        {
            await _fileSystemHelper.WriteMachineLearningAnswerToDisk(request);
            var prevResults = _fileSystemHelper.ReadPreviousMachineLearningAnswers();

            var machineLearningEvaluation = _machineLearningHelper.GenerateResponse(prevResults);

            MachineLearningMessage machineLearningResponse = new MachineLearningMessage();
            machineLearningResponse.PrevResults = prevResults;
            machineLearningResponse.Evaluation = machineLearningEvaluation;

            var jsonString = JsonConvert.SerializeObject(machineLearningResponse);
            var response = new HttpResponseMessage();
            response.StatusCode = HttpStatusCode.OK;
            response.Content = new StringContent(jsonString);
            return response;
        }

        public HttpResponseMessage GenerateHttpResponse()
        {
            var prevResults = _fileSystemHelper.ReadPreviousMachineLearningAnswers();

            var machineLearningEvaluation = _machineLearningHelper.GenerateResponse(prevResults);

            //In here I want to create an object that contains prev results but also deals with special values such as most common etc

            MachineLearningMessage machineLearningResponse = new MachineLearningMessage();
            machineLearningResponse.PrevResults = prevResults;
            machineLearningResponse.Evaluation = machineLearningEvaluation;

            var jsonString = JsonConvert.SerializeObject(machineLearningResponse);
            var response = new HttpResponseMessage();
            response.StatusCode = HttpStatusCode.OK;
            response.Content = new StringContent(jsonString);
            return response;
        }

    }
}