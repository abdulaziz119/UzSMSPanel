import { HttpException, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom } from 'rxjs';
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';

@Injectable()
export class AxiosService {
  constructor(private readonly httpService: HttpService) {}

  public async sendRequest<Response>(url, params): Promise<Response> {
    const config = {
      headers: {
        // Authorization: headers['authorization'],
        // 'Accept-Language': headers['accept-language'],
        Accept: 'application/json',
      },
    };

    const { data } = await firstValueFrom(
      this.httpService.post<Response>(url, params, config).pipe(
        catchError((error: AxiosError) => {
          console.log(error);
          throw new HttpException(error.response.data, error.response.status);
        }),
      ),
    );

    return data;
  }

  public async sendPutRequest<Response>(url, params): Promise<Response> {
    const { data } = await firstValueFrom(
      this.httpService.put<Response>(url, params).pipe(
        catchError((error: AxiosError) => {
          console.log(error);
          throw new HttpException(error.response.data, error.response.status);
        }),
      ),
    );

    return data;
  }

  public async sendDeleteRequest<Response>(url): Promise<Response> {
    const { data } = await firstValueFrom(
      this.httpService.delete<Response>(url).pipe(
        catchError((error: AxiosError) => {
          console.log(error);
          throw new HttpException(error.response.data, error.response.status);
        }),
      ),
    );

    return data;
  }

  public async sendGetRequest<Response>(url, params = null): Promise<Response> {
    if (params) {
      params = { params: params };
    } else {
      params = {};
    }
    const { data } = await firstValueFrom(
      this.httpService.get<Response>(url, params).pipe(
        catchError((error: AxiosError) => {
          console.log(error);
          throw new HttpException(error.response.data, error.response.status);
        }),
      ),
    );

    return data;
  }

  public async sendWithAuthRequest<Response>(
    url,
    params,
    headers,
  ): Promise<Response> {
    const config = {
      headers: {
        'User-Type': headers['guest'],
        // Authorization: headers['authorization'],
        'Accept-Language': headers['accept-language'],
      },
    };

    const { data } = await firstValueFrom(
      this.httpService.post<Response>(url, params, config).pipe(
        catchError((error: AxiosError) => {
          console.log(error.response);
          throw new HttpException(error.response.data, error.response.status);
        }),
      ),
    );

    return data;
  }

  public async sendPostTokenRequest<Response>(
    url,
    params,
    headers,
  ): Promise<Response> {
    const config = {
      headers: {
        'User-Type': headers['guest'],
        Authorization: headers['authorization'],
        'Accept-Language': headers['accept-language'],
      },
    };

    const { data } = await firstValueFrom(
      this.httpService.post<Response>(url, params, config).pipe(
        catchError((error: AxiosError) => {
          console.log(error.response);
          throw new HttpException(error.response.data, error.response.status);
        }),
      ),
    );

    return data;
  }

  async sendGetFileRequest<T = any>(
    url: string,
    payload: any,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    try {
      config = {
        ...config,
        responseType: 'arraybuffer',
        params: payload,
      };
      return await axios.get<T>(url, config);
    } catch (error) {
      throw error;
    }
  }

  async sendPostFileRequest<T = any>(
    url: string,
    payload: any,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    try {
      config = {
        ...config,
        responseType: 'arraybuffer',
      };
      return await axios.post<T>(url, payload, config);
    } catch (error) {
      console.error('Error in sendPostFileRequest:', error);
      throw error;
    }
  }
}
