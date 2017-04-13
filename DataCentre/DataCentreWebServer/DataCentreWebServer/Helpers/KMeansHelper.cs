using DataCentreWebServer.Helpers;
using System;
using System.Collections.Generic;
using System.Linq;

namespace DataCentreWebServer.MachineLearning
{
    //this class will handle the kmean operation
    public class KMeansHelper
    {
        //https://visualstudiomagazine.com/Articles/2013/12/01/K-Means-Data-Clustering-Using-C.aspx?admgarea=features&Page=1

        public Movie[] kmeans(Movie[] movies, int numberOfMoviesToReturn)
        {
            int numClusters = 10;
            
            int[] clustering = Cluster(movies, numClusters);

            return GetMovieSubsetFromClusters(movies, clustering, numClusters, numberOfMoviesToReturn);
        }

        private int[] Cluster(Movie[] movies, int numClusters)
        {
            // k-means clustering
            // index of return is tuple ID, cell is cluster ID
            // ex: [2 1 0 0 2 2] means tuple 0 is cluster 2, tuple 1 is cluster 1, tuple 2 is cluster 0, tuple 3 is cluster 0, etc.
            // an alternative clustering DS to save space is to use the .NET BitArray class

            //Movie[] normalisedData = Normalized(movies); // so large values don't dominate
            var normalisedData = movies;

            bool changed = true; // was there a change in at least one cluster assignment?
            bool success = true; // were all means able to be computed? (no zero-count clusters)

            // init clustering[] to get things started
            // an alternative is to initialize means to randomly selected tuples
            // then the processing loop is
            // loop
            //    update clustering
            //    update means
            // end loop

            int[] clustering = InitClustering(normalisedData.Length, numClusters, 0); // semi-random initialization
            //12 is the number of vectors in the movie object
            Movie[] means = Allocate(numClusters); // small convenience

            int maxCount = normalisedData.Length * 10; // sanity check
            int ct = 0;
            while (changed && success && ct < maxCount)
            {
                LoggerHelper.Log("Did one loop of clustering");

                ++ct; // k-means typically converges very quickly
                success = UpdateMeans(normalisedData, clustering, means); // compute new cluster means if possible. no effect if fail
                changed = UpdateClustering(normalisedData, clustering, means); // (re)assign tuples to clusters. no effect if fail
            }

            // consider adding means[][] as an out parameter - the final means could be computed
            // the final means are useful in some scenarios (e.g., discretization and RBF centroids)
            // and even though you can compute final means from final clustering, in some cases it
            // makes sense to return the means (at the expense of some method signature uglinesss)
            //
            // another alternative is to return, as an out parameter, some measure of cluster goodness
            // such as the average distance between cluster means, or the average distance between tuples in 
            // a cluster, or a weighted combination of both
            return clustering;
        }

        private Movie[] Normalized(Movie[] movies)
        {
            // normalize raw data by computing (x - mean) / stddev
            // primary alternative is min-max:
            // v' = (v - min) / (max - min)

            // make a copy of input data
            Movie[] movieCopy = new Movie[movies.Length];
            Array.Copy(movies, movieCopy, movies.Length);
            
            double yearTotal = 0.0;
            double percentageHorrorTotal = 0.0;
            double percentageComedyTotal = 0.0;
            double percentageActionTotal = 0.0;
            double percentageAdventureTotal = 0.0;
            double percentageFantasyTotal = 0.0;
            double percentageRomanceTotal = 0.0;
            double containsViolenceTotal = 0.0;
            double containsSexualScenesTotal = 0.0;
            double containsDrugUseTotal = 0.0;
            double containsFlashingImagesTotal = 0.0;

            for(int j = 0; j < movieCopy.Length; j++)
            {
                yearTotal += movieCopy[j].Year;
                percentageHorrorTotal += movieCopy[j].PercentageHorror;
                percentageComedyTotal += movieCopy[j].PercentageComedy;
                percentageActionTotal += movieCopy[j].PercentageAction;
                percentageAdventureTotal += movieCopy[j].PercentageAdventure;
                percentageFantasyTotal += movieCopy[j].PercentageFantasy;
                percentageRomanceTotal += movieCopy[j].PercentageRomance;
            }

            double yearMean = yearTotal / movieCopy.Length;
            double percentageHorrorMean = percentageHorrorTotal / movieCopy.Length;
            double percentageComedyMean = percentageComedyTotal / movieCopy.Length;
            double percentageActionMean = percentageActionTotal / movieCopy.Length;
            double percentageAdventureMean = percentageAdventureTotal / movieCopy.Length;
            double percentageFantasyMean = percentageFantasyTotal / movieCopy.Length;
            double percentageRomanceMean = percentageRomanceTotal / movieCopy.Length;

            double yearSum = 0.0;
            double percentageHorrorSum = 0.0;
            double percentageComedySum = 0.0;
            double percentageActionSum = 0.0;
            double percentageAdventureSum = 0.0;
            double percentageFantasySum = 0.0;
            double percentageRomanceSum = 0.0;

            for (int j = 0; j < movieCopy.Length; j++)
            {
                yearSum += (movieCopy[j].Year - yearMean) * (movieCopy[j].Year - yearMean);
                percentageHorrorSum += (movieCopy[j].PercentageHorror - percentageHorrorMean) * (movieCopy[j].PercentageHorror - percentageHorrorMean);
                percentageComedySum += (movieCopy[j].PercentageComedy - percentageComedyMean) * (movieCopy[j].PercentageComedy - percentageComedyMean);
                percentageActionSum += (movieCopy[j].PercentageAction - percentageActionMean) * (movieCopy[j].PercentageAction - percentageActionMean);
                percentageAdventureSum += (movieCopy[j].PercentageAdventure - percentageAdventureMean) * (movieCopy[j].PercentageAdventure - percentageAdventureMean);
                percentageFantasySum += (movieCopy[j].PercentageFantasy - percentageFantasyMean) * (movieCopy[j].PercentageFantasy - percentageFantasyMean);
                percentageRomanceSum += (movieCopy[j].PercentageRomance - percentageRomanceMean) * (movieCopy[j].PercentageRomance - percentageRomanceMean);
            }

            double yearSd = yearSum/ movieCopy.Length;
            double percentageHorrorSd = percentageHorrorSum / movieCopy.Length;
            double percentageComedySd = percentageComedySum / movieCopy.Length;
            double percentageActionSd = percentageActionSum / movieCopy.Length;
            double percentageAdventureSd = percentageAdventureSum / movieCopy.Length;
            double percentageFantasySd = percentageFantasySum / movieCopy.Length;
            double percentageRomanceSd = percentageRomanceSum / movieCopy.Length;

            for (int j = 0; j < movieCopy.Length; j++)
            {
                movieCopy[j].Year = Convert.ToInt32((movieCopy[j].Year - yearMean) / yearSd);
                movieCopy[j].PercentageHorror = (movieCopy[j].PercentageHorror - percentageHorrorMean) / percentageHorrorSd;
                movieCopy[j].PercentageComedy = (movieCopy[j].PercentageComedy - percentageComedyMean) / percentageComedySd;
                movieCopy[j].PercentageAction = (movieCopy[j].PercentageAction - percentageActionMean) / percentageActionSd;
                movieCopy[j].PercentageAdventure = (movieCopy[j].PercentageAdventure - percentageAdventureMean) / percentageAdventureSd;
                movieCopy[j].PercentageFantasy = (movieCopy[j].PercentageFantasy - percentageFantasyMean) / percentageFantasySd;
                movieCopy[j].PercentageRomance = (movieCopy[j].PercentageRomance - percentageRomanceMean) / percentageRomanceSd;
            }

            return movieCopy;
        }

        private int[] InitClustering(int numTuples, int numClusters, int randomSeed)
        {
            // init clustering semi-randomly (at least one tuple in each cluster)
            // consider alternatives, especially k-means++ initialization,
            // or instead of randomly assigning each tuple to a cluster, pick
            // numClusters of the tuples as initial centroids/means then use
            // those means to assign each tuple to an initial cluster.
            Random random = new Random(randomSeed);
            int[] clustering = new int[numTuples];
            for (int i = 0; i < numClusters; ++i) // make sure each cluster has at least one tuple
                clustering[i] = i;
            for (int i = numClusters; i < clustering.Length; ++i)
                clustering[i] = random.Next(0, numClusters); // other assignments random
            return clustering;
        }

        private Movie[] Allocate(int numClusters)
        {
            // convenience matrix allocator for Cluster()
            Movie[] result = new Movie[numClusters];

            for (int i = 0; i < result.Length; i++)
            {
                result[i] = new Movie();
            }

            return result;
        }

        private bool UpdateMeans(Movie[] movies, int[] clustering, Movie[] means)
        {
            // returns false if there is a cluster that has no tuples assigned to it
            // parameter means[][] is really a ref parameter

            // check existing cluster counts
            // can omit this check if InitClustering and UpdateClustering
            // both guarantee at least one tuple in each cluster (usually true)
            int numClusters = means.Length;
            int[] clusterCounts = new int[numClusters];
            for (int i = 0; i < movies.Length; ++i)
            {
                int cluster = clustering[i];
                ++clusterCounts[cluster];
            }

            for (int k = 0; k < numClusters; ++k)
            {
                if (clusterCounts[k] == 0)
                {
                    return false; // bad clustering. no change to means[][]
                }
            }

            // update, zero-out means so it can be used as scratch matrix 
            for (int k = 0; k < means.Length; ++k)
            {
                means[k].Year = 0;
                means[k].PercentageHorror = 0.0;
                means[k].PercentageComedy = 0.0;
                means[k].PercentageAction = 0.0;
                means[k].PercentageAdventure = 0.0;
                means[k].PercentageFantasy = 0.0;
                means[k].PercentageRomance = 0.0;
            }

            for (int i = 0; i < movies.Length; ++i)
            {
                int cluster = clustering[i];
                //sum everything
                means[cluster].Year += movies[i].Year;
                means[cluster].PercentageHorror += movies[i].PercentageHorror;
                means[cluster].PercentageComedy += movies[i].PercentageComedy;
                means[cluster].PercentageAction += movies[i].PercentageAction;
                means[cluster].PercentageAdventure += movies[i].PercentageAdventure;
                means[cluster].PercentageFantasy += movies[i].PercentageFantasy;
                means[cluster].PercentageRomance += movies[i].PercentageRomance;
            }

            for (int k = 0; k < means.Length; ++k)
            {
                means[k].Year /= clusterCounts[k];
                means[k].PercentageHorror /= clusterCounts[k];
                means[k].PercentageComedy /= clusterCounts[k];
                means[k].PercentageAction /= clusterCounts[k];
                means[k].PercentageAdventure /= clusterCounts[k];
                means[k].PercentageFantasy /= clusterCounts[k];
                means[k].PercentageRomance /= clusterCounts[k];
            }

            return true;
        }

        private bool UpdateClustering(Movie[] movies, int[] clustering, Movie[] means)
        {
            // (re)assign each tuple to a cluster (closest mean)
            // returns false if no tuple assignments change OR
            // if the reassignment would result in a clustering where
            // one or more clusters have no tuples.

            int numClusters = means.Length;
            bool changed = false;

            int[] newClustering = new int[clustering.Length]; // proposed result
            Array.Copy(clustering, newClustering, clustering.Length);

            double[] distances = new double[numClusters]; // distances from curr tuple to each mean

            for (int i = 0; i < movies.Length; ++i) // walk thru each tuple
            {
                for (int k = 0; k < numClusters; ++k)
                {
                    distances[k] = Distance(movies[i], means[k]); // compute distances from curr tuple to all k means
                }

                int newClusterID = MinIndex(distances); // find closest mean ID
                if (newClusterID != newClustering[i])
                {
                    changed = true;
                    newClustering[i] = newClusterID; // update
                }
            }

            if (changed == false)
            {
                return false; // no change so bail and don't update clustering[][]
            }

            // check proposed clustering[] cluster counts
            int[] clusterCounts = new int[numClusters];
            for (int i = 0; i < movies.Length; ++i)
            {
                int cluster = newClustering[i];
                ++clusterCounts[cluster];
            }

            for (int k = 0; k < numClusters; ++k)
            {
                if (clusterCounts[k] == 0)
                {
                    return false; // bad clustering. no change to clustering[][]
                }
            }

            Array.Copy(newClustering, clustering, newClustering.Length); // update

            return true; // good clustering and at least one change
        }

        private double Distance(Movie tuple, Movie mean)
        {
            // Euclidean distance between two vectors for UpdateClustering()
            // consider alternatives such as Manhattan distance
            double sumSquaredDiffs = 0.0;

            sumSquaredDiffs += Math.Pow((tuple.Year - mean.Year), 2);
            sumSquaredDiffs += Math.Pow((tuple.PercentageHorror - mean.PercentageHorror), 2);
            sumSquaredDiffs += Math.Pow((tuple.PercentageComedy - mean.PercentageComedy), 2);
            sumSquaredDiffs += Math.Pow((tuple.PercentageAction - mean.PercentageAction), 2);
            sumSquaredDiffs += Math.Pow((tuple.PercentageAdventure - mean.PercentageAdventure), 2);
            sumSquaredDiffs += Math.Pow((tuple.PercentageFantasy - mean.PercentageFantasy), 2);
            sumSquaredDiffs += Math.Pow((tuple.PercentageRomance - mean.PercentageRomance), 2);
            
            return Math.Sqrt(sumSquaredDiffs);
        }

        private int MinIndex(double[] distances)
        {
            // index of smallest value in array
            // helper for UpdateClustering()
            int indexOfMin = 0;
            double smallDist = distances[0];
            for (int k = 0; k < distances.Length; ++k)
            {
                if (distances[k] < smallDist)
                {
                    smallDist = distances[k];
                    indexOfMin = k;
                }
            }
            return indexOfMin;
        }

        static void ShowData(Movie[] movies, int decimals, bool indices, bool newLine)
        {
            for (int i = 0; i < movies.Length; ++i)
            {
                var stringToWrite = string.Empty;

                if (indices)
                {
                    stringToWrite += i.ToString().PadLeft(3) + " ";
                }

                var movie = movies[i];

                stringToWrite += " " + movie.ID;
                stringToWrite += " " + movie.Title;
                stringToWrite += " " + movie.Year;
                stringToWrite += " " + movie.PercentageHorror;
                stringToWrite += " " + movie.PercentageComedy;
                stringToWrite += " " + movie.PercentageAction;
                stringToWrite += " " + movie.PercentageAdventure;
                stringToWrite += " " + movie.PercentageFantasy;
                stringToWrite += " " + movie.PercentageRomance;
                stringToWrite += " " + movie.ContainsViolence;
                stringToWrite += " " + movie.ContainsSexualScenes;
                stringToWrite += " " + movie.ContainsDrugUse;
                stringToWrite += " " + movie.ContainsFlashingImages;
                
                LoggerHelper.Log(stringToWrite);
            }

            if (newLine)
            {
                LoggerHelper.Log("");
            }
        } // ShowData

        static void ShowVector(int[] vector, bool newLine)
        {
            var stringToWrite = "";

            for (int i = 0; i < vector.Length; ++i)
            {
                stringToWrite += vector[i] + " ";
            }

            LoggerHelper.Log(stringToWrite);

            if (newLine)
            {
                LoggerHelper.Log("\n");
            }
        }

        static Movie[] GetMovieSubsetFromClusters(Movie[] movies, int[] clustering, int numClusters, int numberOfMoviesToReturn)
        {
            int numberOfMoviesPerCluster = numberOfMoviesToReturn / numClusters;

            List<List<Movie>> moviesFromEachCluster = new List<List<Movie>>();

            for (int clusterName = 0; clusterName < numClusters; clusterName++)
            {
                moviesFromEachCluster.Add(new List<Movie>());
            }

            for (int k = 0; k < numClusters; ++k)
            {
                LoggerHelper.Log("===================");

                var listToPopulate = moviesFromEachCluster[k];

                for (int i = 0; i < movies.Length; ++i)
                {
                    var stringToWrite = string.Empty;
                    int clusterID = clustering[i];

                    if (clusterID != k)
                    {
                        continue;
                    }

                    listToPopulate.Add(movies[i]);
                }
            }

            //Get a fair subset of all the movies in each cluster
            var posToAdd = 0;
            Movie[] masterCollection = new Movie[numberOfMoviesToReturn];
            foreach (var clusterList in moviesFromEachCluster)
            {
                var numOfMoviesAddedFromThisCluster = 0;
                while (numOfMoviesAddedFromThisCluster < numberOfMoviesPerCluster && numOfMoviesAddedFromThisCluster < clusterList.Count)
                {
                    numOfMoviesAddedFromThisCluster++;

                    //var fairNumber = standard increments between 0 and clusterList.count with enough values to satisy numberOfMoviesPerCluster
                    var incrementValue = clusterList.Count / numberOfMoviesPerCluster;
                    var fairNumber = (numOfMoviesAddedFromThisCluster * incrementValue);

                    masterCollection[posToAdd] = clusterList[fairNumber];

                    posToAdd++;
                }

                LoggerHelper.Log("Added " + numOfMoviesAddedFromThisCluster + " to master collection");
            }
            
            return masterCollection;
        }

        static void ShowClustered(Movie[] movies, int[] clustering, int numClusters, int decimals)
        {
            for (int k = 0; k < numClusters; ++k)
            {
                LoggerHelper.Log("===================");
                for (int i = 0; i < movies.Length; ++i)
                {
                    var stringToWrite = string.Empty;
                    int clusterID = clustering[i];

                    if (clusterID != k)
                    {
                        continue;
                    }

                    stringToWrite += i.ToString().PadLeft(3) + " ";

                    var movie = movies[i];

                    stringToWrite += " " + movie.ID + " ";
                    stringToWrite += " " + movie.Title + " ";
                    stringToWrite += " " + movie.Year + " ";
                    stringToWrite += " " + movie.PercentageHorror.ToString("F" + decimals) + " ";
                    stringToWrite += " " + movie.PercentageComedy.ToString("F" + decimals) + " ";
                    stringToWrite += " " + movie.PercentageAction.ToString("F" + decimals) + " ";
                    stringToWrite += " " + movie.PercentageAdventure.ToString("F" + decimals) + " ";
                    stringToWrite += " " + movie.PercentageFantasy.ToString("F" + decimals) + " ";
                    stringToWrite += " " + movie.PercentageRomance.ToString("F" + decimals) + " ";
                    stringToWrite += " " + movie.ContainsViolence + " ";
                    stringToWrite += " " + movie.ContainsSexualScenes + " ";
                    stringToWrite += " " + movie.ContainsDrugUse + " ";
                    stringToWrite += " " + movie.ContainsFlashingImages + " ";
                    
                    LoggerHelper.Log(stringToWrite);
                }

                LoggerHelper.Log("===================");
            } // k
        }
    }
}