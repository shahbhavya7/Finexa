import { useState } from "react";
import { toast } from "sonner";

// This useFetch hook is a custom React hook that simplifies data fetching and error handling for api calling functions.
// It manages the loading state, error state, and data state, and provides a function to call the provided callback function (cb) with arguments.
// It also allows you to set the data state directly if needed.
// The hook takes a callback function (cb) as an argument, which is expected to return a promise (e.g., an API call).
// The hook returns an object containing the data, loading state, error state, a function to call the callback with arguments (fn), and a function to set the 
// data state directly (setData).
// It also shows an error toast notification if an error occurs during the callback execution.

const useFetch = (cb) => {  // cb is the callback function that will be called to fetch data, e.g., an API call function
  const [data, setData] = useState(undefined); // data state to store the fetched data, initialized to undefined
  const [loading, setLoading] = useState(null); // loading state to indicate if the data is being fetched, initialized to null, used to show loading state in UI
  const [error, setError] = useState(null); // error state to store any error that occurs during the fetch, initialized to null

  const fn = async (...args) => { // fn is the function that will be called to execute the callback with arguments, e.g., an API call with parameters
    setLoading(true); // set loading state to true when the function is called
    setError(null); // reset error state to null before making the API call

    try {
      const response = await cb(...args); // call the callback function (cb) with the provided arguments (args), which is expected to return a data promise
      setData(response); // set the data state with the response from the callback function
      setError(null); // reset error state to null if the API call is successful
    } catch (error) { // catch any error that occurs during the callback execution
      setError(error); // set the error state with the caught error
      toast.error(error.message); // show an error toast notification with the error message
    } finally { // finally block to ensure that the loading state is set to false regardless of success or failure
      setLoading(false);
    }
  };

  return { data, loading, error, fn, setData }; // return an object containing the data, loading state, error state, the function to call the callback (fn), 
  // and a function to set the data state directly (setData)
};

export default useFetch;
