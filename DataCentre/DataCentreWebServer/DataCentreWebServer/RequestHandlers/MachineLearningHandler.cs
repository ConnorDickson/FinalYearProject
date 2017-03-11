using System.Net;
using System.Net.Http;
using DataCentreWebServer.Helpers;
using System.Threading.Tasks;
using Newtonsoft.Json;
using DataCentreWebServer.MachineLearning;
using System;

namespace DataCentreWebServer.RequestHandlers
{
    public class MachineLearningHandler
    {
        private MachineLearningHelper _machineLearningHelper;
        private MachineLearningFileHandler _machineLearningFileHandler;

        public MachineLearningHandler(MachineLearningHelper machineLearningHelper, MachineLearningFileHandler machineLearningFileHandler)
        {
            _machineLearningHelper = machineLearningHelper;
            _machineLearningFileHandler = machineLearningFileHandler;
        }

        public async Task<HttpResponseMessage> ProcessRequest(HttpRequestMessage request)
        {
            try
            {
                //Receive summary information from node
                var requestData = await request.Content.ReadAsStringAsync();

                LoggerHelper.Log(requestData);

                var machineLearningRequest = JsonConvert.DeserializeObject<MachineLearningMessage>(requestData);

                //Store summary info with node name
                _machineLearningFileHandler.StoreNodeResults(machineLearningRequest.hostName, machineLearningRequest.results);

                //Summarise all other data from all other nodes 
                var allResults = _machineLearningFileHandler.AllResultsExcept(machineLearningRequest.hostName);

                //Return summariesed data to requesting node (use results property)
                machineLearningRequest.results = allResults;
                var jsonString = JsonConvert.SerializeObject(machineLearningRequest);
                
                return new HttpResponseMessage()
                {
                    StatusCode = HttpStatusCode.OK,
                    Content = new StringContent(jsonString)
                };
            }
            catch(Exception ex)
            {
                LoggerHelper.Log("An Exception occurred: " + ex.Message + "\n" + ex.StackTrace);

                return new HttpResponseMessage()
                {
                    StatusCode = HttpStatusCode.InternalServerError
                };
            }
        }

        public HttpResponseMessage GenerateHttpResponse()
        {
            //var prevResults = _machineLearningFileHandler.AllResultsExcept();

            ////Use machine learning helper to add all results of other nodes
            //var machineLearningEvaluation = _machineLearningHelper.PrintResults(prevResults);
            



            MachineLearningMessage machineLearningResponse = new MachineLearningMessage();
            var jsonString = JsonConvert.SerializeObject(machineLearningResponse);
            var response = new HttpResponseMessage();
            response.StatusCode = HttpStatusCode.OK;
            response.Content = new StringContent(jsonString);
            return response;
        }
    }
}