import { ALL_TOGGLES, Features } from './features';
import { axiosInstance, useAxios, UseAxiosResponseValue } from './utils';
import { Options } from 'axios-hooks';
import { AxiosPromise, AxiosResponse } from 'axios';
import { FrontendEvent } from '../util/frontend-logger';

export interface AntallUlesteDialoger {
	antallUleste: number;
}

export interface AktivEnhetResponse {
	aktivEnhet: string | null;
}

export interface SistOppdatertData {
	sistOppdatert?: string;
}

export interface AuthInfo {
	loggedIn: boolean;
	remainingSeconds: number;
	expirationTime: string;
	securityLevel?: string;
}

export interface Session {
	created_at?: string;
	ends_at?: string;
	ends_in_seconds?: number;
}

export interface Tokens {
	expire_at?: string;
	expire_in_seconds?: number;
	next_auto_refresh_in_seconds?: number;
	refresh_cooldown?: boolean;
	refresh_cooldown_seconds?: number;
	refreshed_at?: string;
}

export interface SessionMeta {
	session?: Session;
	tokens?: Tokens;
}

export function useFetchAntallUlesteDialoger(
	fnr: string,
	options?: Options
): UseAxiosResponseValue<AntallUlesteDialoger> {
	return useAxios<AntallUlesteDialoger>(`/veilarbdialog/api/dialog/antallUleste?fnr=${fnr}`, options);
}

export function useFetchSistOppdatert(fnr: string, options?: Options): UseAxiosResponseValue<SistOppdatertData> {
	return useAxios<SistOppdatertData>(`/veilarbdialog/api/dialog/sistOppdatert?fnr=${fnr}`, options);
}

export function useFetchFeatures(options?: Options): UseAxiosResponseValue<Features> {
	const toggles = ALL_TOGGLES.map(element => 'feature=' + element).join('&');
	return useAxios<Features>(`/veilarbpersonflatefs/api/feature?${toggles}`, options);
}

export function useFetchAktivEnhet(options?: Options): UseAxiosResponseValue<AktivEnhetResponse> {
	return useAxios<AktivEnhetResponse>('/modiacontextholder/api/context/aktivenhet', options);
}

export function useFetchTilgangTilBruker(fnr: string, options?: Options): UseAxiosResponseValue<true> {
	return useAxios<true>({ url: `/veilarbperson/api/person/${fnr}/tilgangTilBruker` }, options);
}

export function synkroniserManuellStatusMedDkif(fnr: string): AxiosPromise<null> {
	return axiosInstance.post(`/veilarboppfolging/api/v2/manuell/synkroniser-med-dkif?fnr=${fnr}`);
}

export function sendEventTilVeilarbperson(event: FrontendEvent) {
	return axiosInstance.post(`/veilarbperson/api/logger/event`, event);
}

export function hentSesjonMetadata(): Promise<SessionMeta> {
	return axiosInstance.get('/oauth2/session').then((res: AxiosResponse<SessionMeta>) => Promise.resolve(res.data));
}
