namespace DataCentreWebServer.MachineLearning
{
    //This is the c# representation of the JSON movie we receive
    public class Movie
    {
        //1 QKMDVJDI 1961 37 37 24 31 3 64 False False True True
        public int ID;
        public string Title;
        public int Year;
        public double PercentageHorror;
        public double PercentageComedy;
        public double PercentageAction;
        public double PercentageAdventure;
        public double PercentageFantasy;
        public double PercentageRomance;
        public bool ContainsViolence;
        public bool ContainsSexualScenes;
        public bool ContainsDrugUse;
        public bool ContainsFlashingImages;
    }
}