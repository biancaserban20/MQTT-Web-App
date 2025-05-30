import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, Grid, Card, CardMedia, CardContent, MenuItem, Select, FormControl, InputLabel, Stack, Divider } from '@mui/material';
import {
  getAllImages,
  getGalleryDevices,
  getGalleryFilters,
  getGallerySortOptions
} from '../requests/gallery';
import {
  allImages as mockedAllImages,
  galleryDevices as mockedGalleryDevices,
  galleryFilters as mockedGalleryFilters,
  gallerySortOptions as mockedGallerySortOptions
} from '../mocked/gallery';
import ImageModal from '../components/ImageModal';
import { getAllDevices } from '../requests/devices';

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleString();
}

const Gallery = () => {
  const [images, setImages] = useState([]);
  const [realImages, setRealImages] = useState([]);
  const [devices, setDevices] = useState([]);
  const [filters, setFilters] = useState([]);
  const [sortOptions, setSortOptions] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('all');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedSort, setSelectedSort] = useState('newest');
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        // First fetch real images
        const realImg = await getAllImages();
        setRealImages(realImg);

        // Fetch devices from the new endpoint
        const devicesFromApi = await getAllDevices();
        console.log('Devices from API:', devicesFromApi);
        var devicesList = devicesFromApi.map(d => ({ id: d.deviceId, name: d.deviceId }));
        console.log('Devices list:', devicesList);
        if (!devicesList.some(d => d.id === 'all')) {
          devicesList = [{ id: 'all', name: 'All Devices' }, ...devicesList];
        }
        console.log('Devices list after adding all:', devicesList);
        devicesList = [...devicesList, { id: 'processed', name: 'Processed' }];
        console.log('Devices list after adding processed:', devicesList);
        setDevices(devicesList);
        console.log('Devices list after setting:', devicesList);
        // Then fetch other data
        const [fil, sort] = await Promise.all([
          getGalleryFilters(),
          getGallerySortOptions()
        ]);
        setImages(mockedAllImages); // Set mocked images
        // Ensure 'All Time' is always present
        const hasAllTime = fil.some(f => f.value === 'all');
        setFilters(hasAllTime ? fil : [{ value: 'all', label: 'All Time' }, ...fil]);
        setSortOptions(sort);
      } catch (error) {
        setImages(mockedAllImages);
        // setDevices([]);
        const hasAllTime = mockedGalleryFilters.some(f => f.value === 'all');
        setFilters(hasAllTime ? mockedGalleryFilters : [{ value: 'all', label: 'All Time' }, ...mockedGalleryFilters]);
        setSortOptions(mockedGallerySortOptions);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // Filter real images
  const filteredRealImages = realImages
    .filter(img => {
      if (selectedDevice === 'all') return true;
      if (selectedDevice === 'processed') return img.deviceId === 'Processed';
      return img.deviceId === selectedDevice;
    })
    .filter(img => {
      if (selectedFilter === 'all') return true;
      const imgDate = new Date(img.timestamp);
      const now = new Date();
      if (selectedFilter === 'day') {
        return imgDate.toDateString() === now.toDateString();
      } else if (selectedFilter === 'week') {
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        return imgDate >= weekAgo;
      } else if (selectedFilter === 'month') {
        return imgDate.getMonth() === now.getMonth() && imgDate.getFullYear() === now.getFullYear();
      } else if (selectedFilter === 'year') {
        return imgDate.getFullYear() === now.getFullYear();
      }
      return true;
    })
    .sort((a, b) => {
      if (selectedSort === 'newest') {
        return new Date(b.timestamp) - new Date(a.timestamp);
      } else {
        return new Date(a.timestamp) - new Date(b.timestamp);
      }
    });

  const renderImageCard = (img, isReal = false) => {
    return (
      <Grid 
        item 
        key={isReal ? img.filename : img.id} 
        xs={12} 
        sm={6} 
        md={4} 
        lg={3}
        sx={{ 
          display: 'flex',
          justifyContent: 'flex-start'
        }}
      >
        <Card 
          sx={{ 
            width: 240, 
            height: 240, 
            display: 'flex', 
            flexDirection: 'column',
            cursor: 'pointer',
            '&:hover': {
              boxShadow: 6
            }
          }}
          onClick={() => setSelectedImage(img)}
        >
          <CardMedia
            component="img"
            height="160"
            image={img.url}
            alt={isReal ? img.deviceId : img.deviceName}
            sx={{ objectFit: 'cover' }}
          />
          <CardContent sx={{ p: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">
              {isReal ? img.deviceId : img.deviceName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatDate(isReal ? img.timestamp : img.timestamp)}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    );
  };

  const handleImageProcessed = (processedImage) => {
    // Add the new processed image to the real images list
    setRealImages(prevImages => [...prevImages, {
      id: processedImage.filename,
      filename: processedImage.filename,
      url: processedImage.url,
      deviceId: 'Processed',
      deviceName: 'Processed',
      timestamp: new Date().toISOString()
    }]);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ textAlign: 'center' }}>
        Gallery
      </Typography>
      <Stack 
        direction={{ xs: 'column', sm: 'row' }} 
        spacing={2} 
        sx={{ 
          mb: 3,
          width: '100%',
          height: '80px',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <FormControl sx={{ minWidth: 180 }}>
          <InputLabel shrink={true}>Device</InputLabel>
          <Select
            value={selectedDevice}
            label="Device"
            onChange={e => setSelectedDevice(e.target.value)}
          >
            {devices.map(dev => (
              <MenuItem key={dev.id} value={dev.id}>{dev.name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 180 }}>
          <InputLabel shrink={true}>Time</InputLabel>
          <Select
            value={selectedFilter}
            label="Time"
            onChange={e => setSelectedFilter(e.target.value)}
          >
            {filters.map(fil => (
              <MenuItem key={fil.value} value={fil.value}>{fil.label}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 180 }}>
          <InputLabel shrink={true}>Sort</InputLabel>
          <Select
            value={selectedSort}
            label="Sort"
            onChange={e => setSelectedSort(e.target.value)}
          >
            {sortOptions.map(opt => (
              <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>
      {loading ? <CircularProgress /> : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {/* Mocked Images Section - Commented out for now
          <Box>
            <Typography variant="h5" gutterBottom>Mocked Images</Typography>
            <Grid 
              container 
              spacing={2} 
              sx={{ 
                minHeight: 'calc(50vh - 100px)',
                maxWidth: '1200px',
                justifyContent: 'flex-start'
              }}
            >
              {filteredImages.map((img, index) => renderImageCard(img, false))}
            </Grid>
          </Box>
          */}

          {/* Real Images Section */}
          <Box>
            <Typography variant="h5" gutterBottom>Images</Typography>
            <Grid 
              container 
              spacing={2} 
              sx={{ 
                minHeight: 'calc(50vh - 100px)',
                maxWidth: '1200px',
                justifyContent: 'flex-start'
              }}
            >
              {filteredRealImages.map((img, index) => renderImageCard(img, true))}
            </Grid>
          </Box>
        </Box>
      )}
      <ImageModal
        open={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        image={selectedImage}
        onImageProcessed={handleImageProcessed}
      />
    </Box>
  );
};

export default Gallery; 