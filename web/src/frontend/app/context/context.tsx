import * as React from 'react';
import { AlertStripeAdvarselSolid } from 'nav-frontend-alertstriper';
import { connect } from 'react-redux';
import EnhetContextListener, {
    EnhetConnectionState,
    EnhetContextEvent,
    EnhetContextEventNames
} from './context-listener';
import { FormattedMessage, IntlProvider, addLocaleData } from 'react-intl';
import * as nb from 'react-intl/locale-data/nb';
import ContextFeilmodal from './context-feilmodal';
import { erDev } from '../utils/utils';
import {hentAktivBruker, hentAktivEnhet, hentIdent, oppdaterAktivBruker} from './context-api';
import { hentFodselsnummerFraURL, sendEventOmPersonFraURL, settPersonIURL } from '../eventhandtering';
import NyBrukerModal from './ny-bruker-modal';
import { initialiserToppmeny } from '../utils/dekorator-utils';
import { enhetFinnesIUrl, leggEnhetIUrl, miljoFraUrl } from '../utils/url-utils';
import { tekster } from './context-tekster';

import './context.less';

addLocaleData(nb);

interface EnhetContextState {
    brukerModalSynlig: boolean;
    feilmodalSynlig: boolean;
    tilkoblingState: EnhetConnectionState;
    lastBrukerPending: boolean;
    tekster: any;
    fnrContext: string;
    ident: string;
}

export default class EnhetContext extends React.Component<{}, EnhetContextState> {
    contextListener: EnhetContextListener;

    constructor(props) {
        super(props);
        this.state = {
            brukerModalSynlig: false,
            feilmodalSynlig: false,
            fnrContext: hentFodselsnummerFraURL(),
            lastBrukerPending: false,
            tilkoblingState: EnhetConnectionState.NOT_CONNECTED,
            tekster: {},
            ident: ''
        };

        this.enhetContextHandler = this.enhetContextHandler.bind(this);
    }

    componentDidMount() {
        window.addEventListener('popstate', () => {
            this.oppdaterAktivBrukHvisEndret();
        });

        hentIdent()
            .then((ident) => {
                this.contextListener = new EnhetContextListener(this.websocketUri(ident), this.enhetContextHandler);
            });

        const fnrFraUrl = hentFodselsnummerFraURL();
        if(fnrFraUrl != null) {
            this.oppdaterAktivBrukHvisEndret();
        } else {
            this.oppdaterSideMedNyAktivBruker();
        }

        if(!enhetFinnesIUrl()) {
            this.handleNyAktivEnhet();
        }
    }

    componentWillUnmount() {
        this.contextListener.close();
    }

    websocketUri(ident) {
        const miljo = erDev() ? '-t6' : miljoFraUrl();
        return `wss://veilederflatehendelser${miljo}.adeo.no/modiaeventdistribution/ws/${ident}`;
    }

    handleFeilet() {
        this.setState({
            lastBrukerPending: false,
            brukerModalSynlig: false,
            feilmodalSynlig: true
        });
    }

    oppdaterAktivBrukHvisEndret() {
        const fnrFraUrl = hentFodselsnummerFraURL();
        return hentAktivBruker()
            .then((nyBruker) => {
                this.setState({fnrContext: nyBruker});

                if (nyBruker !== fnrFraUrl) {
                    oppdaterAktivBruker(fnrFraUrl);
                }
            }).catch(() => this.handleFeilet());
    }

    oppdaterSideMedNyAktivBruker() {
        hentAktivBruker()
            .then((bruker) => {
                const fnrFraUrl = hentFodselsnummerFraURL();
                this.setState({fnrContext: bruker});

                if (bruker !=  null && bruker !== fnrFraUrl) {
                    settPersonIURL(bruker);
                    sendEventOmPersonFraURL();
                }
            }).catch(() => this.handleFeilet());
    }

    handleNyAktivBruker() {
        hentAktivBruker()
            .then((nyBruker) => {
                const fnrFraUrl = hentFodselsnummerFraURL();
                this.setState({fnrContext: nyBruker});

                if (fnrFraUrl == null) {
                    this.oppdaterSideMedNyAktivBruker();
                } else if (nyBruker !== fnrFraUrl) {
                    this.setState({
                        brukerModalSynlig: true
                    });
                }
            }).catch(() => this.handleFeilet());
    }

    handleNyAktivEnhet() {
        hentAktivEnhet()
            .then((enhet) => {
                leggEnhetIUrl(enhet);
                initialiserToppmeny();
            }).catch(() => this.handleFeilet());
    }

    enhetContextHandler(event: EnhetContextEvent) {
        switch (event.type) {
            case EnhetContextEventNames.CONNECTION_STATE_CHANGED:
                this.setState({ tilkoblingState: event.state });
                break;
            case EnhetContextEventNames.NY_AKTIV_ENHET:
                this.handleNyAktivEnhet();
                break;
            case EnhetContextEventNames.NY_AKTIV_BRUKER:
                this.handleNyAktivBruker();
                break;
        }
    }

    handleLastNyBruker() {
        this.oppdaterSideMedNyAktivBruker();
        this.setState({ brukerModalSynlig: false });
    }

    handleFortsettSammeBruker() {
        this.setState({lastBrukerPending: true});
        this.oppdaterAktivBrukHvisEndret()
            .then(() => this.setState({
                brukerModalSynlig: false,
                lastBrukerPending: false
            }));
    }

    render() {
        const alertIkkeTilkoblet = (
            <AlertStripeAdvarselSolid>
                <FormattedMessage {...tekster.wsfeilmelding} />
            </AlertStripeAdvarselSolid>
        );

        return (
            <IntlProvider locale="nb" defaultLocale="nb">
                <div>
                    { this.state.tilkoblingState === EnhetConnectionState.FAILED ? alertIkkeTilkoblet : null }

                    <NyBrukerModal
                        isOpen={this.state.brukerModalSynlig === true}
                        isPending={this.state.lastBrukerPending}
                        doLastNyBruker={() => this.handleLastNyBruker()}
                        doFortsettSammeBruker={() => this.handleFortsettSammeBruker()}
                        fodselsnummer={this.state.fnrContext}
                    />

                    <ContextFeilmodal
                        isOpen={this.state.feilmodalSynlig}
                        onClose={() => this.setState({ feilmodalSynlig: false })}
                    />
                </div>
            </IntlProvider>
        );
    }
}
