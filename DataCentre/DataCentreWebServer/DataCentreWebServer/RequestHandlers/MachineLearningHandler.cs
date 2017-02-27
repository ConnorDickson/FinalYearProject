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
            var prevResults = _fileSystemHelper.ReadPreviousMachineLearningAnswers();

            machineLearningRequest.PrevResults = prevResults;
            var numOfQueries = _machineLearningHelper.NumberOfQueries(machineLearningRequest);
            if (numOfQueries == 1)
            {
                var machineLearningEvaluation = _machineLearningHelper.PerformEvaluation(machineLearningRequest, prevResults);
                machineLearningRequest.Evaluation = machineLearningEvaluation;
            }
            else if (numOfQueries > 1)
            {
                machineLearningRequest.Evaluation = "Too many queries";
            }
            else
            {
                var answer = machineLearningRequest.Choice1 + "," + machineLearningRequest.Choice2 + "," + machineLearningRequest.Choice3 + "," + machineLearningRequest.Choice4;
                _fileSystemHelper.WriteMachineLearningAnswerToDisk(answer);
                machineLearningRequest.Evaluation = "Written answer to DC disk";
            }

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

            var machineLearningEvaluation = _machineLearningHelper.PrintResults(prevResults);
            
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