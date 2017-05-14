import React, { Component, PropTypes } from 'react';
import axios from 'axios';
import Select from 'react-select';
import Modal from 'react-bootstrap/lib/Modal';

export default class RoomModal extends Component {
  static propTypes = {
    save: PropTypes.func.isRequired,
    showModal: PropTypes.bool.isRequired,
    data: PropTypes.object,
    close: PropTypes.func.isRequired,
    roles: PropTypes.array.isRequired
  };

  state = {
    ...this.props.data,
    error: { message: '' }
  };

  componentWillReceiveProps(nextProps) {
    if (this.props !== nextProps) {
      this.setState({
        ...nextProps.data,
        error: { message: '' }
      });
    }
  }

  addMember() {
    const defaultRole = this.props.roles[0]._id;
    const memberObj = { email: '', role: defaultRole };
    this.setState({
      ...this.state,
      members: [...this.state.members, memberObj]
    });
  }

  removeMember(position) {
    this.state.members.splice(position, 1);

    this.setState({
      ...this.state,
      members: [...this.state.members]
    });
  }

  updateMember(memberPosition, prop, value, worker) {
    const member = this.state.members[memberPosition];
    member[prop] = worker(value);
    this.setState({
      ...this.state,
      members: [...this.state.members]
    });
  }

  getOptions(input, value) {
    return axios.get(`api/user/find/${input}`)
      .then(({data}) => {
        const options = data.map(user => ({value: user.email, label: user.username}));

        if (!input && value && !this.checkOptions(value, options)) {
          return {options: [{label: value, value}]};
        }

        return {options};
      }).catch(err => console.error(err));
  }

  getRoleId(title) {
    return this.props.roles.find(role => role.title === title)._id;
  }

  checkOptions(value, options) {
    return options.find(option => option.value === value);
  }

  checkMembers(members) {
    return members.find(member => !member.email);
  }

  save() {
    const {title, description, isVisible} = this.state;
    let members = this.state.members;

    if (title && description && !this.checkMembers(members)) {
      const data = this.props.data;

      members = members.map(member => ({
        ...member, email: member.email.value || member.email
      }));

      const args = {title, description, members, isVisible};

      if (data && data._id) {
        args.id = data._id;
      }

      this.props.save(args);
      this.props.close();
      this.setState({ title: '', description: '', error: null });
    } else {
      this.setState({ error: { message: 'All fields are required' }});
    }
  }

  close() {
    if (this.state.error) this.setState({ error: null });
    this.props.close();
  }

  render() {
    const { showModal, close, roles } = this.props;
    const { title, description, members, isVisible } = this.state;
    const buttonGroup = { marginTop: 30 };
    const notEmphatic = { border: 'none' };
    const lined = { lineHeight: 1 };
    const error = { color: '#ac2925' };
    const bordered = {
      padding: '5px 10px',
      borderRadius: 5,
      border: '1px solid #ccc'
    };
    const memberRow = {
      marginTop: 15,
      minHeight: 35
    };
    const memberRemoveCol = {
      lineHeight: '30px'
    };
    const memberRemoveBtn = {
      verticalAlign: 'center',
      height: '34px',
      width: '100%',
      color: 'red',
      backgroundColor: 'white',
      borderColor: '#cccccc'
    };
    const memberCreateBtn = {
      fontSize: '14px'
    };
    const visibilityCheckBox = {display: 'inline', marginLeft: '5px'};

    return (
      <Modal show={ showModal } onHide={ close }>
        <Modal.Header closeButton style={ notEmphatic }>
          <Modal.Title>Make your room and have some fun</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <link rel="stylesheet" href="https://unpkg.com/react-select/dist/react-select.css"/>
          <div className="row">
            <div className="col-md-12">
              <label style={ error }>{ this.state.error && this.state.error.message }</label>
              <div className="form-group">
                <label htmlFor="title" style={ lined }>Title:</label>
                <input
                  style={ bordered }
                  className="form-control"
                  type="text"
                  placeholder="Enter your title"
                  defaultValue={ title }
                  onChange={e => this.setState({title: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label htmlFor="description" style={lined}>Description:</label>
                <textarea
                  style={ bordered }
                  className="form-control"
                  placeholder="Enter your description"
                  defaultValue={ description }
                  onChange={e => this.setState({description: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label htmlFor="visibility" style={lined}>Visibility:</label>
                <div className="checkbox" style={visibilityCheckBox}>
                  <label>
                    <input
                      type="checkbox"
                      checked={isVisible}
                      onChange={e => {
                        this.setState({isVisible: e.target.checked})
                      }}
                    />
                    Do you want to give an access to unauthorized members?
                  </label>
                </div>
              </div>
              <div className="form-group">
                <div className="row">
                  <div className="col-md-12">
                    <label htmlFor="members" style={ lined }>Members:</label>
                    <button className="btn btn-link btn-xs" style={memberCreateBtn} onClick={this.addMember.bind(this)}>
                      Create
                    </button>
                  </div>
                </div>
                { members.map((member, index) => {
                  const key = `member-${index}`;
                  const memberRole = roles.find(role => role._id === member.role);

                  return (
                    <div className="row" style={memberRow} key={key}>
                      <div className="col-md-5 col-sm-5">
                        <Select.AsyncCreatable
                          multi={false}
                          value={member.email}
                          onChange={
                            value => this.updateMember(index, 'email', value, v => v)
                          }
                          placeholder="Enter member email"
                          loadOptions={(input) => this.getOptions.call(this, input, member.email)}
                        />
                      </div>
                      <div className="col-md-5 col-sm-5">
                        <select
                          style={ bordered }
                          className="form-control"
                          placeholder="Choose role"
                          value={memberRole && memberRole.title}
                          onChange={
                            e => this.updateMember(index, 'role', e.target.value, this.getRoleId.bind(this))
                          }
                        >
                          { roles.map(role =>
                            <option value={role.title} key={`role-${role.title}`}>
                              {role.title}
                            </option>)
                          }
                        </select>
                      </div>
                      <div className="col-md-2 col-sm-2" style={memberRemoveCol}>
                        <button className="btn btn-xs"
                                style={memberRemoveBtn}
                                onClick={() => this.removeMember(index)}>
                          <i className="fa fa-remove"/>
                        </button>
                      </div>
                    </div>
                  );
                })
                }
              </div>
              <div style={ buttonGroup }>
                <button className="btn btn-success pull-right" onClick={ this.save.bind(this) } >Save</button>
                <button className="btn btn-link pull-right" onClick={ this.close.bind(this) }>Cancel</button>
              </div>
            </div>
          </div>
        </Modal.Body>
      </Modal>
    );
  }
}
