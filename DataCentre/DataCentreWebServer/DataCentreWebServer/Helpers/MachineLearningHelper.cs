using System;
using System.Collections.Generic;
using System.Linq;
using DataCentreWebServer.MachineLearning;

namespace DataCentreWebServer.Helpers
{
    public class MachineLearningHelper
    {
        internal string PerformEvaluation(MachineLearningMessage machineLearningRequest, List<string> prevResults)
        {
            var mostCommonResult = prevResults
                                        .GroupBy(x => x)
                                        .OrderByDescending(pr => pr.Count())
                                        .Select(x => x.Key)
                                        .FirstOrDefault();

            var result = "The most common result is: " + mostCommonResult + Environment.NewLine;
            var yResults = 0;
            var nResults = 0;

            if (machineLearningRequest.Choice1 == Constants.MachineLearning.Query)
            {
                yResults = Probability(prevResults, "True", machineLearningRequest.Choice2, machineLearningRequest.Choice3, machineLearningRequest.Choice4);
                nResults = Probability(prevResults, "False", machineLearningRequest.Choice2, machineLearningRequest.Choice3, machineLearningRequest.Choice4);
                result += "The first choice will be evaluated" + Environment.NewLine;
            }
            else if (machineLearningRequest.Choice2 == Constants.MachineLearning.Query)
            {
                yResults = Probability(prevResults, machineLearningRequest.Choice1, "True", machineLearningRequest.Choice3, machineLearningRequest.Choice4);
                nResults = Probability(prevResults, machineLearningRequest.Choice1, "False", machineLearningRequest.Choice3, machineLearningRequest.Choice4);
                result += "The second choice will be evaluated" + Environment.NewLine;
            }
            else if (machineLearningRequest.Choice3 == Constants.MachineLearning.Query)
            {
                yResults = Probability(prevResults, machineLearningRequest.Choice1, machineLearningRequest.Choice2, "True", machineLearningRequest.Choice4);
                nResults = Probability(prevResults, machineLearningRequest.Choice1, machineLearningRequest.Choice2, "False", machineLearningRequest.Choice4);
                result += "The third choice will be evaluated" + Environment.NewLine;
            }
            else if (machineLearningRequest.Choice4 == Constants.MachineLearning.Query)
            {
                yResults = Probability(prevResults, machineLearningRequest.Choice1, machineLearningRequest.Choice2, machineLearningRequest.Choice3, "True");
                nResults = Probability(prevResults, machineLearningRequest.Choice1, machineLearningRequest.Choice2, machineLearningRequest.Choice2, "False");
                result += "The fourth choice will be evaluated" + Environment.NewLine;
            }

            if (yResults > nResults)
            {
                result += "The result is True";
            } else
            {
                result += "The result is False";
            }

            return result;
        }

        internal string PrintResults(List<string> prevResults)
        {
            var result = string.Empty;

            foreach (var prevResult in prevResults)
            {
                result += prevResults + Environment.NewLine;
            }

            return result;
        }

        private int Probability(List<string> prevResults, string choice1, string choice2, string choice3, string choice4)
        {
            var predictedChoices = choice1 + "," + choice2 + "," + choice3 + "," + choice4;
            LoggerHelper.Log("Evaluating prob: " + predictedChoices);

            var totalCount = 0;
            foreach(var result in prevResults)
            {
                if(result == predictedChoices)
                {
                    totalCount++;
                }
            }

            return totalCount;
        }

        internal int NumberOfQueries(MachineLearningMessage machineLearningRequest)
        {
            var countNumber = 0;

            if(machineLearningRequest.Choice1 == "Query")
            {
                countNumber++;
            }

            if (machineLearningRequest.Choice2 == "Query")
            {
                countNumber++;
            }

            if (machineLearningRequest.Choice3 == "Query")
            {
                countNumber++;
            }

            if (machineLearningRequest.Choice4 == "Query")
            {
                countNumber++;
            }

            return countNumber;
        }
    }
}