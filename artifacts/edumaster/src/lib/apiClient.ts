import { setAuthTokenGetter } from "@workspace/api-client-react/custom-fetch";

export function initApiClient() {
  setAuthTokenGetter(() => {
    return localStorage.getItem("edumaster_token");
  });
}
