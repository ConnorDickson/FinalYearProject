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

        public async Task<HttpResponseMessage> ProcessRequest(HttpRequestMessage request)
        {
            var requestData = await request.Content.ReadAsStringAsync();
            
            var machineLearningRequest = JsonConvert.DeserializeObject<MachineLearningMessage>(requestData);

            _fileSystemHelper.WriteMachineLearningAnswerToDisk(machineLearningRequest.CurrentChoice);

            var prevResults = _fileSystemHelper.ReadPreviousMachineLearningAnswers();

            var machineLearningEvaluation = _machineLearningHelper.GenerateResponse(prevResults);

            machineLearningRequest.PrevResults = prevResults;
            machineLearningRequest.Evaluation = machineLearningEvaluation;

            var jsonString = JsonConvert.SerializeObject(machineLearningRequest);

            return new HttpResponseMessage()
            {
                StatusCode = HttpStatusCode.OK,
                Content = new StringContent(jsonString)
            };
        }

        public HttpResponseMessage GenerateHttpResponse()
        {
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

    }
}