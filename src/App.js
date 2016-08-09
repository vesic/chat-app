import React, { Component } from 'react';
import socket from './socket';
import _ from 'lodash';
import request from 'superagent';
import {Chance} from 'chance';
import {Gmaps, Marker, InfoWindow, Circle} from 'react-gmaps';

// center the map
const coords = {
  lat: 32,
  lng: -114
};

export default class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      users: [],
      connected: false,
      connectedUser: null,
      chatMessages: [],
      room: ''
    }

    socket.on('connect', () => {
      console.log('Client connected');
    })

    socket.on('users', users => {
      this.setState({users});

      let userIds = _.map(this.state.users, (user) => user.id);
      if (this.state.connectedUser && !_.includes(userIds, this.state.connectedUser.id)) {
        this.setState({
          connected: false,
          connectedUser: null
        })
      }
    });

    socket.on('connect-success', (connectedUser) => {
      this.setState({
        statusText: 'you are online!',
        connected: true,
        connectedUser: connectedUser,
      });
    })

    socket.on('disconnect-success', () => {
      this.setState({
        statusText: 'you are offline!',
        connected: false,
        connectedUser: null
      })
    })

    socket.on('chat-messages', (messages) => {
      this.setState({
        chatMessages: messages
      })
    })
  }

  componentDidMount() {
    window.addEventListener('beforeunload', () => {
      socket.emit('disconnect-user', this.state.connectedUser);
    });
  }

  // map opts
  onMapCreated(map) {
    map.setOptions({
      disableDefaultUI: true,
      scrollwheel: false
    });
  }

  onMarkerClick(e) {
    // This could potentially do something
  }

  joinChat(room, e) {
    e.preventDefault();

    if (!this.state.connected) {
      this.refs.userName.focus();
      alert('Connect to select channel!');
      return;
    }

    this.setState({room});
    socket.emit('join-room', room);
    // alert('join room');
  }

  sendMessage(e) {
    if (e.key === 'Enter') {
      socket.emit('send-message', [
        e.target.value,
        this.state.connectedUser,
        this.state.room
      ]);
      e.target.value = '';
    }
  }

  connectUser() {
    // prevent connect if there is no free slots
    if (this.state.users.length > 9) {
      alert('No open slots, try again later!');
      this.refs.userName.value = '';
      return;
    }

    // no blank input allowed
    let user = this.refs.userName.value;
    if (user === '') return;

    // get loc
    navigator.geolocation.getCurrentPosition(
      (position) => {
        socket.emit('connect-user', user, position.coords.latitude, position.coords.longitude);
      },
      () => {
        alert('You need to enable geolocation to be able to use this app!')
        this.refs.userName.value = '';
      });
  }

  disconnectUser() {
    socket.emit('disconnect-user', this.state.connectedUser);
    this.setState({
      connected: false,
      connectedUser: null,
      messages: []
    })
  }

  renderConnectControls() {
    return (this.state.connected)
      ?
      (
        <button
          onClick={::this.disconnectUser}
          className='btn btn-default btn-block'>
          Disconnect
        </button>
      )
      :
      (
        <div className="input-group">
          <input
            className="form-control"
            placeholder="Your Name"
            ref='userName'/>
          <span
            onClick={::this.connectUser}
            className="btn input-group-addon">
            Connect
          </span>
        </div>
      )
  }

  renderStatus() {
    return (this.state.connected)
      ?
      (
        <div>
          <span style={{marginRight:5}}>{this.state.connectedUser.name}</span>
          <span style={{color:'green'}} className='glyphicon glyphicon-ok'></span>
        </div>
      )
      :
      (
        <div
          style={{color:'red'}}
          className='glyphicon glyphicon-remove'>
        </div>
      )
  }

  renderChat() {
    return (this.state.connected && this.state.room)
      ?
      (
        <div>
          <h2>#{_.capitalize(this.state.room)}</h2>
          <div>
            <input
              className='form-control input-sm' onKeyPress={::this.sendMessage}/>
          </div>
          <div id='chatWrapper'
            style={{marginTop:10, maxHeight:'600px', overflow:'auto'}}>
          {
            _.map(this.state.chatMessages, message => {
              return (
                <div
                  style={{borderBottom: '1px dotted black'}}
                  key={`${_.random(0, 1000)}-${message[1].id}-${_.random(0, 1000)}`}
                  className="media">
                  <div className="media-body">
                    <div className="media-heading">
                      <strong>{_.capitalize(message[1].name)}</strong> ~ {message[0]}
                    </div>
                  </div>
                </div>
              )
            })
          }
          </div>
        </div>
      )
      :
      (
        <div>
          <h2>Select channel</h2>
          <div>To write your message</div>
        </div>
      )
  }

  render() {
    return (
      <div>
        <div className='row'>
          <div className='col-md-4 text-center'>
            <h1>{10 - this.state.users.length} slots left!</h1>
          </div>
          <div className='col-md-4'>
            <h1>{this.renderConnectControls()}</h1>
          </div>
          <div className='col-md-4 text-center'>
            <h1>
              {this.renderStatus()}
            </h1>
          </div>
        </div>
        <div className='row'>
          <div className='col-xs-12'>
            <Gmaps
              width={'100%'}
              height={'600px'}
              lat={coords.lat}
              lng={coords.lng}
              zoom={2}
              params={{v: '3.exp', key: 'AIzaSyDJ7OYq7mtqUDW9JXcCHpqDtA0RVHo7g8s'}}
              onMapCreated={this.onMapCreated}>
              {
                _.map(this.state.users, user =>
                  <Marker
                    key={user.id}
                    lat={user.lat}
                    lng={user.lng}
                    onClick={this.onMarkerClick}
                  />)
              }
            </Gmaps>
          </div>
        </div>
          <div className='row'>
            <div className='col-xs-4'>
              <h2>Online users:</h2>
              <div className="list-group">
                {
                  _.map(this.state.users, user => {
                    return (
                      <a href="#" className="list-group-item"
                        key={user.id}>
                        {user.name}
                      </a>
                    )
                  })
                }
              </div>
            </div>
            <div className='col-xs-4'>
              <h2>Channels</h2>
              <div className="list-group">
                <a href="#" onClick={this.joinChat.bind(this, 'javascript')}
                  className={this.state.room === 'javascript'?'active list-group-item':'list-group-item'}>Javascript</a>
                <a href="#" onClick={this.joinChat.bind(this, 'react')}
                  className={this.state.room === 'react'?'active list-group-item':'list-group-item'}>React</a>
                <a href="#" onClick={this.joinChat.bind(this, 'angular')}
                  className={this.state.room === 'angular'?'active list-group-item':'list-group-item'}>Angular</a>
                <a href="#" onClick={this.joinChat.bind(this, 'express')}
                  className={this.state.room === 'express'?'active list-group-item':'list-group-item'}>Express</a>
                <a href="#" onClick={this.joinChat.bind(this, 'mongo')}
                  className={this.state.room === 'mongo'?'active list-group-item':'list-group-item'}>Mongo</a>
              </div>
            </div>
            <div className='col-xs-4'>
              {this.renderChat()}
            </div>
          </div>
      </div>
    );
  }
}
