using System;
using System.Collections.Generic;
using System.Linq;

namespace DataCentreWebServer.Helpers
{
    public class MachineLearningHelper
    {
        public string GenerateResponse()
        {
            return "From MachineLearning";
        }

        internal string GenerateResponse(List<string> prevResults)
        {
            var mostCommonResult = prevResults
                                        .GroupBy(x => x)
                                        .OrderByDescending(pr => pr.Count())
                                        .Select(x => x.Key)
                                        .FirstOrDefault();

            var response = string.Empty;

            foreach(var result in prevResults)
            {
                response += result + ",";
            }

            return response.TrimEnd(',') + "<br>The most common result is: " + mostCommonResult;
        }
    }
}