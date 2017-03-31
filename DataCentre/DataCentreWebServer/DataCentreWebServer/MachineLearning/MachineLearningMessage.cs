namespace DataCentreWebServer.MachineLearning
{
    //This is the C# representation of the JSON object we recieve
    public class MachineLearningMessage
    {
        public string UserID;
        public Movie[] Results;
        public string Recommendation;
        public string RequestedMovieID;
        public AverageMovie AverageResults;
    }
}