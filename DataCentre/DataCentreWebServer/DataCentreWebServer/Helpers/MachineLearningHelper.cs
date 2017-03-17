using System;
using System.Collections.Generic;
using DataCentreWebServer.MachineLearning;

namespace DataCentreWebServer.Helpers
{
    public class MachineLearningHelper
    {
        public string PerformEvaluation(MachineLearningMessage machineLearningRequest, List<string> prevResults)
        {
            var result = "";
            
            return result;
        }

        internal string[] Kmetoid(string[] lines)
        {
            foreach (var line in lines)
            {
                //Process vectors and perform nearst neighbour
                //k - evaluation to send a big variation of movies to Edge (maybe 1000?)
            }

            return null;
        }
    }
}