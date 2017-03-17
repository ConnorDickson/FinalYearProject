﻿using System.Net;
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

        public HttpResponseMessage ReturnMovies(HttpRequestMessage request)
        {
            try
            {
                //Read movies from disk
                var lines = _machineLearningFileHandler.GetMovieLinesFromDisk();
                //Create subset of movies
                var linesToReturn = _machineLearningHelper.Kmetoid(lines);

                //Return subset to Edge
                var machineLearningMessage = new MachineLearningMessage()
                {
                    results = linesToReturn
                };

                var jsonString = JsonConvert.SerializeObject(machineLearningMessage);

                return new HttpResponseMessage()
                {
                    StatusCode = HttpStatusCode.OK,
                    Content = new StringContent(jsonString)
                };
            }
            catch (Exception ex)
            {
                LoggerHelper.Log("An Exception occurred: " + ex.Message + "\n" + ex.StackTrace);

                return new HttpResponseMessage()
                {
                    StatusCode = HttpStatusCode.InternalServerError
                };
            }
        }

        internal async Task<HttpResponseMessage> StoreUserResult(HttpRequestMessage request)
        {
            var requestData = await request.Content.ReadAsStringAsync();
            var machineLearningRequest = JsonConvert.DeserializeObject<MachineLearningMessage>(requestData);


            bool storedResult = _machineLearningFileHandler.StoreUserResult(machineLearningRequest);

            
            var jsonString = JsonConvert.SerializeObject(machineLearningRequest);
            var response = new HttpResponseMessage();
            response.StatusCode = HttpStatusCode.OK;
            response.Content = new StringContent(jsonString);
            return response;
        }
    }
}