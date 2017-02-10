using System.Collections.Generic;

namespace DataCentreWebServer.MachineLearning
{
    public class MachineLearningMessage
    {
        public List<string> PrevResults;
        public string Evaluation;
        public string PreProcessedData;
        public string CurrentChoice;
    }
}