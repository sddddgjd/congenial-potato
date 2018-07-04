import React from 'react';
import { TextInput, Text, View, Dimensions, ListView } from 'react-native';
import { Ionicons } from '@expo/vector-icons'
import axios from 'axios'

export default class HomeView extends React.Component {
  constructor() {
    super()

    var foodDataSource = new ListView.DataSource({
      rowHasChanged: (r1, r2) => r1 !== r2
    });

    this.state = { text: '', inputWidth: Dimensions.get('window').width - 74, foodDataSource }

    this.search = this.search.bind(this)

  }

  async search() {
    /*try {
      const res = await axios.post('https://api.nal.usda.gov/ndb/V2/reports?ndbno=01009&ndbno=01009&ndbno=45202763&ndbno=35193&type=b&format=json&api_key=1ICWXYt40nvyTLkN0LaTlSE23BQj7AWbfVGhhhGC', reqBody)
      console.log(res)
    } catch (err) {
      console.log(err)
    }*/
    const searchTerms = this.state.text.split(" ")
    let query = ''
    searchTerms.forEach((term) => {
      query += term + '+'
    })

    query = query.slice(0, -1)
    try {
      const res = await axios.get('https://api.nal.usda.gov/ndb/search/?format=json&q=' + query + '&sort=r&max=25&offset=0&api_key=1ICWXYt40nvyTLkN0LaTlSE23BQj7AWbfVGhhhGC')
      this.setState({ foodDataSource: this.state.foodDataSource.cloneWithRows(res.data.list.item) })
    } catch (err) {
      console.log(err)
    }
  }

  render() {
    return (
      <View style={{ flex: 1, paddingLeft: 5, paddingRight: 5 }}>
        <View style={{ flexDirection: 'row', height: 60 }}>
          <TextInput
            style={{ height: 40, borderColor: 'black', borderWidth: 1, width: this.state.inputWidth }}
            onChangeText={(text) => this.setState({ text })}
            value={this.state.text} />
          <View onPress={this.search}>
            <Ionicons onPress={this.search} name="md-search" size={32} color="black" caca="fefe" style={{ marginLeft: 16, marginTop: 5 }} />
          </View>
        </View>
        <View>
          <ListView
            dataSource={this.state.foodDataSource}
            renderRow={(food) => <View style={{ paddingTop: 10, paddingBottom: 10 }}><Text>{food.name}</Text></View>}
          />
        </View>
      </View>
    )
  }
}

