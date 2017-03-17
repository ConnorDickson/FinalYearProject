using DataCentreWebServer.Helpers;
using System;
using System.Collections.Generic;
using System.IO;
using System.Threading;
using System.Web;
using System.Linq;

namespace DataCentreWebServer.MachineLearning
{
    public class MachineLearningFileHandler
    {
        private static ReaderWriterLockSlim _readWriteLock = new ReaderWriterLockSlim();

        public string[] GetMovieLinesFromDisk()
        {
            _readWriteLock.EnterReadLock();

            try
            {
                var rootPath = HttpRuntime.AppDomainAppPath.TrimEnd('\\');
                var filePath = rootPath + Constants.MachineLearning.MachineLearningFile;
                var lines = File.ReadAllLines(filePath);
                return lines;
            }
            catch(Exception ex)
            {
                LoggerHelper.Log(ex.Message + "\n" + ex.StackTrace);
            }
            finally
            {
                _readWriteLock.ExitReadLock();
            }

            return null;
        }

        internal bool StoreUserResult(MachineLearningMessage machineLearningRequest)
        {
            _readWriteLock.EnterWriteLock();

            try
            {
                var rootPath = HttpRuntime.AppDomainAppPath.TrimEnd('\\');
                //Store result into the users results (currentResults.txt)
                var filePath = rootPath + Constants.MachineLearning.MachineLearningFile;

                if (!File.Exists(filePath))
                {
                    using (File.Create(filePath)) { }
                }



                //if (lineUpdated)
                //{
                //    File.WriteAllLines(filePath, lines);
                //}
                //else
                //{
                //    File.AppendAllText(filePath, completedLine + Environment.NewLine);
                //}
            }
            finally
            {
                _readWriteLock.ExitWriteLock();
            }

            return false;
        }
    }
}