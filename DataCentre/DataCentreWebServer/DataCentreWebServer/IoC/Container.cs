using DataCentreWebServer.Helpers;
using DataCentreWebServer.RequestHandlers;
using DataCentreWebServer.MachineLearning;

namespace DataCentreWebServer.IoC
{
    //this will be the inversion of control (IoC) container 
    // its purpose is to create a concrete instance of the object
    public static class Container
    {
        public static PythonRequestHandler ResolvePythonRequestHandler()
        {
            return new PythonRequestHandler();
        }

        public static VoiceRecognitionHandler ResolveVoiceRecognitionHandler()
        {
            return new VoiceRecognitionHandler(ResolveFileSystemHelper(), ResolveVoiceRecognitionHelper(), ResolveCPUHelper());
        }
        
        public static MachineLearningHandler ResolveMachineLearningHandler()
        {
            return new MachineLearningHandler(ResolveMachineLearningHelper(), ResolveMachineLearningFileHandler());
        }

        private static MachineLearningHelper ResolveMachineLearningHelper()
        {
            return new MachineLearningHelper(ResolveMovieParser(), ResolveKMeansHelper());
        }

        private static VoiceRecognitionHelper ResolveVoiceRecognitionHelper()
        {
            return new VoiceRecognitionHelper();
        }
        
        private static MachineLearningFileHandler ResolveMachineLearningFileHandler()
        {
            return new MachineLearningFileHandler();
        }

        private static FileSystemHelper ResolveFileSystemHelper()
        {
            return new FileSystemHelper();
        }

        private static MovieParser ResolveMovieParser()
        {
            return new MovieParser();
        }

        private static CPUHelper ResolveCPUHelper()
        {
            return new CPUHelper();
        }

        private static KMeansHelper ResolveKMeansHelper()
        {
            return new KMeansHelper();
        }
    }
}